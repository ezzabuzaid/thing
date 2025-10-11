import { Hono } from 'hono';
import { z } from 'zod';

import { prisma } from '@agent/db';

import { authenticate } from '../middlewares/middleware.ts';
import { validate } from '../middlewares/validator.ts';

type TimesheetTree = Array<{
  client: { id: string; name: string };
  months: Array<{
    key: string; // e.g. 2025-10
    label: string; // e.g. Oct 2025
    entries: Array<{
      id: string;
      date: string;
      hours: string;
      billable: boolean;
      note: string | null;
      currency: string | null;
      hourlyRate: string;
      project: { id: string; name: string };
      updatedAt: string;
    }>;
  }>;
}>;

export default async function (router: Hono) {
  /**
   * @openapi timesheetTree
   * @tags timesheet
   * @description Return hour entries grouped by client and month. Date range can be restricted via optional since/until.
   */
  router.get(
    '/timesheet/tree',
    authenticate(),
    validate((payload) => ({
      since: {
        select: payload.query.since,
        against: z.coerce.date().optional(),
      },
      until: {
        select: payload.query.until,
        against: z.coerce.date().optional(),
      },
    })),
    async (c) => {
      const { since, until } = c.var.input;

      let dateFilterSql = '';
      const params: Date[] = [];

      if (since && until) {
        dateFilterSql = 'AND e.date >= $1 AND e.date <= $2';
        params.push(since, until);
      } else if (since) {
        dateFilterSql = 'AND e.date >= $1';
        params.push(since);
      } else if (until) {
        dateFilterSql = 'AND e.date <= $1';
        params.push(until);
      }

      // Use raw SQL with JSON aggregation to group at database level
      const queryStr = `
        WITH entries_with_month AS (
          SELECT
            c.id AS client_id,
            c.name AS client_name,
            TO_CHAR(e.date, 'YYYY-MM') AS month_key,
            TO_CHAR(e.date, 'Mon YYYY') AS month_label,
            e.id,
            e.date,
            e.hours,
            e.billable,
            e.note,
            e.currency,
            e."hourlyRate",
            e."updatedAt",
            p.id AS project_id,
            p.name AS project_name,
            DATE_TRUNC('month', e.date) AS month_date
          FROM "Client" c
          INNER JOIN "Project" p ON p."clientId" = c.id
          INNER JOIN "HourEntry" e ON e."projectId" = p.id
          WHERE 1=1 ${dateFilterSql}
        ),
        months_grouped AS (
          SELECT
            client_id,
            client_name,
            month_key,
            month_label,
            month_date,
            json_agg(
              json_build_object(
                'id', id,
                'date', date,
                'hours', hours,
                'billable', billable,
                'note', note,
                'currency', currency,
                'hourlyRate', "hourlyRate",
                'updatedAt', "updatedAt",
                'project', json_build_object('id', project_id, 'name', project_name)
              )
              ORDER BY date DESC
            ) AS entries
          FROM entries_with_month
          GROUP BY client_id, client_name, month_key, month_label, month_date
        )
        SELECT
          json_build_object('id', client_id, 'name', client_name) AS client,
          json_agg(
            json_build_object(
              'key', month_key,
              'label', month_label,
              'entries', entries
            )
            ORDER BY month_date DESC
          ) AS months
        FROM months_grouped
        GROUP BY client_id, client_name
        ORDER BY client_name ASC
      `;

      const result: TimesheetTree = await prisma.$queryRawUnsafe(
        queryStr,
        ...params,
      );

      return c.json(result);
    },
  );
}
