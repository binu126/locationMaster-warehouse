import swaggerJsdoc from "swagger-jsdoc";

const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Location API",
      version: "1.0.0",
    },
    servers: [
      { url: "http://localhost:3000" }
    ],
  },
  apis: ["./src/routes/*.ts"],
});

export default swaggerSpec; // ✅ THIS LINE IS REQUIRED
