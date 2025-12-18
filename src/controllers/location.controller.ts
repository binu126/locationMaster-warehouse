import { Request, Response } from "express";
import { getPool } from "../config/db.js";

/**
 * GET /api/locations
 * GET /api/locations?type=WAREHOUSE&status=ACTIVE
 */
export const getLocations = async (req: Request, res: Response) => {
  try {
    const { type, status } = req.query;

    let query = "SELECT * FROM Locations WHERE 1=1";
    if (type) query += " AND type = @type";
    if (status) query += " AND status = @status";

    const pool = await getPool();
    const request = pool.request();

    if (type) request.input("type", type as string);
    if (status) request.input("status", status as string);

    const result = await request.query(query);
    res.json(result.recordset);
  } catch (error) {
    console.error("Error fetching locations:", error);
    res.status(500).json({ message: "Failed to fetch locations" });
  }
};

/**
 * GET /api/locations/:id
 */
export const getLocationById = async (req: Request, res: Response) => {
  try {
    const pool = await getPool();
    const result = await pool
      .request()
      .input("id", Number(req.params.id))
      .query("SELECT * FROM Locations WHERE id = @id");

    if (!result.recordset.length) {
      return res.status(404).json({ message: "Location not found" });
    }

    res.json(result.recordset[0]);
  } catch (error) {
    console.error("Error fetching location:", error);
    res.status(500).json({ message: "Failed to fetch location" });
  }
};

/**
 * POST /api/locations
 */
export const createLocation = async (req: Request, res: Response) => {
  try {
    const {
      code,
      name,
      type,
      address,
      capacity,
      usedCapacity = 0,
      status = "ACTIVE",
      temperatureControlled = false,
      minTemperature,
      maxTemperature
    } = req.body;

    // Required fields
    if (!code || !name || !type || !address || capacity === undefined) {
      return res.status(400).json({
        message: "Missing required fields"
      });
    }

    // Capacity rules
    if (usedCapacity < 0) {
      return res.status(400).json({
        message: "Used capacity cannot be negative"
      });
    }

    if (usedCapacity > capacity) {
      return res.status(400).json({
        message: "Used capacity cannot exceed capacity"
      });
    }

    // Temperature rules
    if (temperatureControlled) {
      if (minTemperature === undefined || maxTemperature === undefined) {
        return res.status(400).json({
          message: "Temperature range required when temperatureControlled is true"
        });
      }

      if (minTemperature >= maxTemperature) {
        return res.status(400).json({
          message: "minTemperature must be less than maxTemperature"
        });
      }
    } else {
      if (minTemperature !== undefined || maxTemperature !== undefined) {
        return res.status(400).json({
          message: "Temperature values not allowed when temperature control is disabled"
        });
      }
    }

    const pool = await getPool();

    const result = await pool
      .request()
      .input("code", code)
      .input("name", name)
      .input("type", type)
      .input("address", address)
      .input("capacity", capacity)
      .input("usedCapacity", usedCapacity)
      .input("status", status)
      .input("temperatureControlled", temperatureControlled)
      .input("minTemperature", minTemperature ?? null)
      .input("maxTemperature", maxTemperature ?? null)
      .query(`
        INSERT INTO Locations
        (code, name, type, address, capacity, usedCapacity, status,
         temperatureControlled, minTemperature, maxTemperature)
        OUTPUT INSERTED.*
        VALUES
        (@code, @name, @type, @address, @capacity, @usedCapacity, @status,
         @temperatureControlled, @minTemperature, @maxTemperature)
      `);

    res.status(201).json(result.recordset[0]);
  } catch (error) {
    console.error("Error creating location:", error);
    res.status(500).json({ message: "Failed to create location" });
  }
};

/**
 * PUT /api/locations/:id
 */
export const updateLocation = async (req: Request, res: Response) => {
  try {
    const {
      name,
      type,
      address,
      capacity,
      usedCapacity,
      status,
      temperatureControlled,
      minTemperature,
      maxTemperature
    } = req.body;

    // Capacity rules
    if (usedCapacity !== undefined && usedCapacity < 0) {
      return res.status(400).json({
        message: "Used capacity cannot be negative"
      });
    }

    if (
      capacity !== undefined &&
      usedCapacity !== undefined &&
      usedCapacity > capacity
    ) {
      return res.status(400).json({
        message: "Used capacity cannot exceed capacity"
      });
    }

    // Temperature rules
    if (temperatureControlled === true) {
      if (minTemperature === undefined || maxTemperature === undefined) {
        return res.status(400).json({
          message: "Temperature range required when temperatureControlled is true"
        });
      }

      if (minTemperature >= maxTemperature) {
        return res.status(400).json({
          message: "minTemperature must be less than maxTemperature"
        });
      }
    }

    if (temperatureControlled === false) {
      if (minTemperature !== undefined || maxTemperature !== undefined) {
        return res.status(400).json({
          message: "Temperature values not allowed when temperature control is disabled"
        });
      }
    }

    const pool = await getPool();

    const result = await pool
      .request()
      .input("id", Number(req.params.id))
      .input("name", name ?? null)
      .input("type", type ?? null)
      .input("address", address ?? null)
      .input("capacity", capacity ?? null)
      .input("usedCapacity", usedCapacity ?? null)
      .input("status", status ?? null)
      .input("temperatureControlled", temperatureControlled ?? null)
      .input("minTemperature", minTemperature ?? null)
      .input("maxTemperature", maxTemperature ?? null)
      .query(`
        UPDATE Locations
        SET
          name = COALESCE(@name, name),
          type = COALESCE(@type, type),
          address = COALESCE(@address, address),
          capacity = COALESCE(@capacity, capacity),
          usedCapacity = COALESCE(@usedCapacity, usedCapacity),
          status = COALESCE(@status, status),
          temperatureControlled = COALESCE(@temperatureControlled, temperatureControlled),
          minTemperature = COALESCE(@minTemperature, minTemperature),
          maxTemperature = COALESCE(@maxTemperature, maxTemperature),
          updatedAt = GETDATE()
        WHERE id = @id
      `);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ message: "Location not found" });
    }

    const updated = await pool
      .request()
      .input("id", Number(req.params.id))
      .query("SELECT * FROM Locations WHERE id = @id");

    res.json(updated.recordset[0]);
  } catch (error) {
    console.error("Error updating location:", error);
    res.status(500).json({ message: "Failed to update location" });
  }
};

/**
 * DELETE /api/locations/:id
 */
export const deleteLocation = async (req: Request, res: Response) => {
  try {
    const pool = await getPool();

    const result = await pool
      .request()
      .input("id", Number(req.params.id))
      .query("DELETE FROM Locations WHERE id = @id");

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ message: "Location not found" });
    }

    res.json({ message: "Location deleted successfully" });
  } catch (error) {
    console.error("Error deleting location:", error);
    res.status(500).json({ message: "Failed to delete location" });
  }
};
