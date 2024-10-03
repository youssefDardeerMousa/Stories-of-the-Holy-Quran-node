import { CustomError } from '../utils/customError.js';
import { Isauthorize } from '../middlewares/authorizeMiddleware.js';
import { Isauthenticate } from '../middlewares/authMiddleware.js';
import { connection, pool } from '../db/connection.js';

export const resolversProphets = {
  Query: {
    getVideos: async (parent, { page = 1, limit = 5 }, context) => {
      try {
        Isauthenticate(context.req);  // تأكد من أن المستخدم مصادق

        const offset = (page - 1) * limit;  // حساب الإزاحة
        const [rows] = await pool.execute('SELECT * FROM prophets_videos LIMIT ? OFFSET ?', [limit, offset]);
        const [countRows] = await pool.execute('SELECT COUNT(*) as total FROM prophets_videos');

        const total = countRows[0].total;
        const totalPages = Math.ceil(total / limit);

        return {
          videos: rows,
          total,
          page,
          totalPages,
        };
      } catch (error) {
        throw new CustomError(error.message || 'Failed to fetch videos');
      }
    },

    getVideo: async (parent, { id }, context) => {
      try {
        Isauthenticate(context.req);  // تأكد من أن المستخدم مصادق
        const [rows] = await pool.execute('SELECT * FROM prophets_videos WHERE id = ?', [id]);
        if (rows.length === 0) {
          throw new CustomError('Video not found', 404);
        }
        return rows[0];  // أعد الفيديو مباشرةً
      } catch (error) {
        throw new CustomError(error.message || 'Failed to fetch the video');
      }
    },
  },

  Mutation: {
    createVideo: async (parent, { prophet_name, video_title, video_link }, context) => {
      try {
        Isauthenticate(context.req);  // تأكد من أن المستخدم مصادق
        Isauthorize(['admin'])(context.req);  // تأكد من أن المستخدم لديه صلاحيات الأدمن
        const [result] = await pool.execute(
          'INSERT INTO prophets_videos (prophet_name, video_title, video_link) VALUES (?, ?, ?)',
          [prophet_name, video_title, video_link]
        );
        return { id: result.insertId, prophet_name, video_title, video_link };
      } catch (error) {
        throw new CustomError(error.message || 'Failed to create video');
      }
    },

    updateVideo: async (parent, { id, prophet_name, video_title, video_link }, context) => {
      try {
        Isauthenticate(context.req);  // تأكد من أن المستخدم مصادق
        Isauthorize(['admin'])(context.req);  // تأكد من أن المستخدم لديه صلاحيات الأدمن
        const [result] = await pool.execute(
          'UPDATE prophets_videos SET prophet_name = ?, video_title = ?, video_link = ? WHERE id = ?',
          [prophet_name, video_title, video_link, id]
        );
        if (result.affectedRows === 0) {
          throw new CustomError('Video not found or no changes made', 404);
        }
        const [updatedVideo] = await pool.execute('SELECT * FROM prophets_videos WHERE id = ?', [id]);
        return updatedVideo[0];
      } catch (error) {
        throw new CustomError(error.message || 'Failed to update video');
      }
    },

    deleteVideo: async (parent, { id }, context) => {
      try {
        Isauthenticate(context.req);  // تأكد من أن المستخدم مصادق
        Isauthorize(['admin'])(context.req);  // تأكد من أن المستخدم لديه صلاحيات الأدمن
        const [result] = await pool.execute('DELETE FROM prophets_videos WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
          throw new CustomError('Video not found', 404);
        }
        return true;  // إرجاع true عند الحذف الناجح
      } catch (error) {
        throw new CustomError(error.message || 'Failed to delete video');
      }
    },
  },
};
