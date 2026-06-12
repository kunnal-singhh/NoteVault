import request from "supertest";
import app from "../server.js";

describe("Auth Endpoints", () => {
  it("should register a new user", async () => {
    const res = await request(app).post("/api/auth/register").send({
      username: "testuser",
      email: "test@example.com",
      password: "password123",
    });

    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty("accessToken");
    expect(res.body.user).toHaveProperty("username", "testuser");
  });

  it("should not register a user with existing email", async () => {
    // Register first
    await request(app).post("/api/auth/register").send({
      username: "testuser1",
      email: "existing@example.com",
      password: "password123",
    });

    // Try again
    const res = await request(app).post("/api/auth/register").send({
      username: "testuser2",
      email: "existing@example.com",
      password: "password123",
    });

    expect(res.statusCode).toEqual(409);
    expect(res.body.message).toBe("Username or Email already exists");
  });

  it("should login successfully", async () => {
    await request(app).post("/api/auth/register").send({
      username: "loginuser",
      email: "login@example.com",
      password: "password123",
    });

    const res = await request(app).post("/api/auth/login").send({
      email: "login@example.com",
      password: "password123",
    });

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty("accessToken");
  });

  it("should fail login with wrong password", async () => {
    await request(app).post("/api/auth/register").send({
      username: "loginuser2",
      email: "login2@example.com",
      password: "password123",
    });

    const res = await request(app).post("/api/auth/login").send({
      email: "login2@example.com",
      password: "wrongpassword",
    });

    expect(res.statusCode).toEqual(401);
  });
});
