import { Request, Response } from "express";
import { getPool } from "../config/db.js";

/*
 GET /api/locations
 GET /api/locations?type=WAREHOUSE&status=ACTIVE
*/
export const getLocations = async (req: Request, res: Response) => {
  try {
    const {
      page = "1",
      limit = "10",
      type,
      status,
      search,
      sortBy = "id",
      order = "asc"
    } = req.query;

    const pageNumber = Math.max(Number(page) || 1, 1);
    const pageSize = Math.max(Number(limit) || 10, 1);
    const offset = (pageNumber - 1) * pageSize;

    // SORT FIELD
    const allowedSortFields = ["id", "code", "name", "type", "status", "capacity"];
    const safeSortBy =
      typeof sortBy === "string" && allowedSortFields.includes(sortBy)
        ? sortBy
        : "id";

    // ORDER
    const safeOrder =
      typeof order === "string" && order.toLowerCase() === "desc"
        ? "DESC"
        : "ASC";

    let dataQuery = "SELECT * FROM Locations WHERE 1=1";
    let countQuery = "SELECT COUNT(*) as total FROM Locations WHERE 1=1";

    const pool = await getPool();
    const request = pool.request();
    const countRequest = pool.request();

    // Filter: type
    if (type) {
      dataQuery += " AND type = @type";
      countQuery += " AND type = @type";
      request.input("type", type);
      countRequest.input("type", type);
    }

    // Filter: status
    if (status) {
      dataQuery += " AND status = @status";
      countQuery += " AND status = @status";
      request.input("status", status);
      countRequest.input("status", status);
    }

    //  MULTI-FIELD SEARCH
    if (search && typeof search === "string") {
      dataQuery += `
        AND (
          code LIKE @search OR
          name LIKE @search OR
          address LIKE @search
        )
      `;
      countQuery += `
        AND (
          code LIKE @search OR
          name LIKE @search OR
          address LIKE @search
        )
      `;
      request.input("search", `%${search}%`);
      countRequest.input("search", `%${search}%`);
    }

    dataQuery += `
      ORDER BY ${safeSortBy} ${safeOrder}
      OFFSET @offset ROWS
      FETCH NEXT @limit ROWS ONLY
    `;

    request.input("offset", offset);
    request.input("limit", pageSize);

    const [dataResult, countResult] = await Promise.all([
      request.query(dataQuery),
      countRequest.query(countQuery)
    ]);

    const totalRecords = countResult.recordset[0].total;
    const totalPages = Math.ceil(totalRecords / pageSize);

    res.json({
      page: pageNumber,
      limit: pageSize,
      totalRecords,
      totalPages,
      data: dataResult.recordset
    });
  } catch (error) {
    console.error("Error fetching locations:", error);
    res.status(500).json({ message: "Failed to fetch locations" });
  }
};

/*
 GET /api/locations/:id
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

/*
 POST /api/locations
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

    if (!code || !name || !type || !address || capacity === undefined) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    if (usedCapacity < 0 || usedCapacity > capacity) {
      return res.status(400).json({ message: "Invalid capacity values" });
    }

    if (temperatureControlled) {
      if (
        minTemperature === undefined ||
        maxTemperature === undefined ||
        minTemperature >= maxTemperature
      ) {
        return res.status(400).json({ message: "Invalid temperature range" });
      }
    } else if (minTemperature !== undefined || maxTemperature !== undefined) {
      return res.status(400).json({
        message: "Temperature values not allowed when temperature control is disabled"
      });
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

/*
 PUT /api/locations/:id
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

    if (usedCapacity !== undefined && usedCapacity < 0) {
      return res.status(400).json({ message: "Used capacity cannot be negative" });
    }

    if (
      capacity !== undefined &&
      usedCapacity !== undefined &&
      usedCapacity > capacity
    ) {
      return res.status(400).json({ message: "Used capacity cannot exceed capacity" });
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
        UPDATE Locations SET
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

/*
 DELETE /api/locations/:id
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
