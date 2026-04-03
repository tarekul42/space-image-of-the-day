import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import app from "../../../app.js";
import axios from "axios";
import redisClient from "../../config/redis.config.js";

vi.mock("axios");
vi.mock("../../config/redis.config.js", () => ({
  default: {
    get: vi.fn(),
    set: vi.fn(),
    connect: vi.fn(),
    on: vi.fn(),
  },
}));

describe("APOD Module", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/v1/apod", () => {
    it("should return APOD data from cache if available", async () => {
      const mockData = {
        title: "M42: The Orion Nebula",
        url: "https://apod.nasa.gov/apod/image/2404/Orion_Nebula_640.jpg",
        hdurl: "https://apod.nasa.gov/apod/image/2404/Orion_Nebula_HD.jpg",
        explanation: "The Great Orion Nebula is an immense, nearby star-forming region.",
        date: "2024-04-03",
        object_type: "Nebula",
      };
      (redisClient.get as any).mockResolvedValue(JSON.stringify(mockData));

      const response = await request(app).get("/api/v1/apod");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.source).toBe("cache");
      expect(response.body.data.title).toBe("M42: The Orion Nebula");
      expect(axios.get).not.toHaveBeenCalled();
    });

    it("should return APOD data from API if not in cache", async () => {
      (redisClient.get as any).mockResolvedValue(null);
      (axios.get as any).mockResolvedValue({
        data: {
          title: "Andromeda Galaxy",
          url: "https://apod.nasa.gov/apod/image/2404/Andromeda_640.jpg",
          explanation: "The Andromeda Galaxy is a barred spiral galaxy...",
          date: "2024-04-03",
        },
      });

      const response = await request(app).get("/api/v1/apod");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.source).toBe("api");
      expect(response.body.data.object_type).toBe("Galaxy");
      expect(axios.get).toHaveBeenCalled();
    });

    it("should return 400 for invalid date format", async () => {
      const response = await request(app).get("/api/v1/apod?date=invalid-date");

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe("GET /api/v1/apod/random", () => {
    it("should return a random APOD", async () => {
      (axios.get as any).mockResolvedValue({
        data: [
          {
            title: "Pleiades Star Cluster",
            url: "https://apod.nasa.gov/apod/image/2404/Pleiades_640.jpg",
            explanation: "The Pleiades or Seven Sisters is an open star cluster...",
            date: "2024-04-03",
          },
        ],
      });

      const response = await request(app).get("/api/v1/apod/random");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe("Pleiades Star Cluster");
    });
  });
});
