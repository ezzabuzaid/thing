import { z } from "zod";
export const getChatsSchema = z.object({'page': z.number().gt(0).optional().default(1), 'pageSize': z.number().min(1).max(100).optional().default(20)});
export const getChatByIdSchema = z.object({'id': z.string()});
export const updateChatSchema = z.object({'title': z.string().optional(), 'id': z.string()});
export const deleteChatSchema = z.object({'id': z.string()});
export const deleteMessageSchema = z.object({'id': z.string()});
