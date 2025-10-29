import { z } from "zod";
export const createScheduleSchema = z.object({'title': z.string(), 'instructions': z.string(), 'cron': z.string(), 'enabled': z.boolean().optional(), 'connectors': z.array(z.enum(["reddit", "web search", "hackernews"])).optional()});
export const listSchedulesSchema = z.object({'page': z.number().gt(0).default(1), 'pageSize': z.number().min(1).max(100).default(20)});
export const getScheduleByIdSchema = z.object({'id': z.string().uuid()});
export const updateScheduleSchema = z.object({'title': z.string().optional(), 'instructions': z.string().optional(), 'cron': z.string().optional(), 'connectors': z.array(z.enum(["reddit", "web search", "hackernews"])).optional(), 'id': z.string().uuid()});
export const archiveScheduleSchema = z.object({'id': z.string().uuid()});
export const toggleScheduleSchema = z.object({'id': z.string().uuid()});
export const testRunSchema = z.object({'source': z.enum(["user", "system"]).optional().default("system"), 'id': z.string().uuid()});
export const resumeScheduleSchema = z.object({'id': z.string().uuid()});
