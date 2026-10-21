/**
 * A task as exposed by the REST API.
 *
 * The API speaks camelCase while the database stores snake_case, so the
 * repository aliases the columns on the way out instead of leaking the
 * database naming into the frontend.
 */
export type Task = {
  id: string;
  title: string;
  description: string | null;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
};
