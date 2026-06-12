import request from "supertest";
import app from "../server.js";

let token;

beforeEach(async () => {
  // Register and login to get token
  await request(app).post("/api/auth/register").send({
    username: "notetester",
    email: "notetester@example.com",
    password: "password123",
  });

  const res = await request(app).post("/api/auth/login").send({
    email: "notetester@example.com",
    password: "password123",
  });

  token = res.body.accessToken;
});

describe("Note Endpoints", () => {
  it("should create a new note", async () => {
    const res = await request(app)
      .post("/api/notes")
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "Test Note",
        body: "This is a test note.",
        tags: ["test", "jest"],
      });

    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty("title", "Test Note");
    expect(res.body.tags).toContain("jest");
  });

  it("should get all notes", async () => {
    // Create a note
    await request(app)
      .post("/api/notes")
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "Test Note 2",
        body: "This is another test note.",
      });

    const res = await request(app)
      .get("/api/notes")
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toEqual(200);
    expect(Array.isArray(res.body)).toBeTruthy();
    expect(res.body.length).toBeGreaterThan(0);
  });

  it("should soft delete a note", async () => {
    const noteRes = await request(app)
      .post("/api/notes")
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "To be deleted",
        body: "Delete me",
      });

    const noteId = noteRes.body._id;

    const delRes = await request(app)
      .delete(`/api/notes/${noteId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(delRes.statusCode).toEqual(200);

    // Verify it doesn't appear in normal fetch
    const fetchRes = await request(app)
      .get("/api/notes")
      .set("Authorization", `Bearer ${token}`);

    const found = fetchRes.body.find((n) => n._id === noteId);
    expect(found).toBeUndefined();
  });
});
