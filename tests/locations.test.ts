import request from "supertest";
import app from "../src/app";

let createdLocationId: number;

describe("Locations API - CRUD", () => {

  // HEALTH
  it("GET /api/health → 200", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("OK");
  });

  // CREATE
  it("POST /api/locations → 201", async () => {
    const res = await request(app)
      .post("/api/locations")
      .send({
        code: "WH-TEST-1",
        name: "Test Warehouse",
        type: "WAREHOUSE",
        address: "Colombo",
        capacity: 100,
        usedCapacity: 10,
        temperatureControlled: true,
        minTemperature: 2,
        maxTemperature: 8
      });

    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();

    createdLocationId = res.body.id;
  });

  // READ ALL
  it("GET /api/locations → 200", async () => {
    const res = await request(app).get("/api/locations");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  // READ BY ID
  it("GET /api/locations/:id → 200", async () => {
    const res = await request(app)
      .get(`/api/locations/${createdLocationId}`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(createdLocationId);
  });

  // UPDATE
  it("PUT /api/locations/:id → 200", async () => {
    const res = await request(app)
      .put(`/api/locations/${createdLocationId}`)
      .send({
        name: "Updated Warehouse",
        usedCapacity: 20
      });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe("Updated Warehouse");
    expect(res.body.usedCapacity).toBe(20);
  });

  // VALIDATION ERROR
  it("PUT should fail if usedCapacity > capacity", async () => {
    const res = await request(app)
      .put(`/api/locations/${createdLocationId}`)
      .send({
        capacity: 50,
        usedCapacity: 200
      });

    expect(res.status).toBe(400);
  });

  // DELETE
  it("DELETE /api/locations/:id → 200", async () => {
    const res = await request(app)
      .delete(`/api/locations/${createdLocationId}`);

    expect(res.status).toBe(200);
  });

  // DELETE NOT FOUND
  it("DELETE non-existing location → 404", async () => {
    const res = await request(app).delete("/api/locations/999999");
    expect(res.status).toBe(404);
  });

});
