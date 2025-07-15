import app from '../index';
let server: any;
export const baseURL = 'http://localhost:3001';

export async function setup() {
  server = app.listen(3001);
}

export async function teardown() {
  if (server) {
    server.close();
  }
}
