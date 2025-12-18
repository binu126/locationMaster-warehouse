CREATE TABLE Locations (
  id INT IDENTITY(1,1) PRIMARY KEY,
  code NVARCHAR(50) NOT NULL,
  name NVARCHAR(100) NOT NULL,
  type NVARCHAR(50) NOT NULL,
  address NVARCHAR(255),
  capacity INT NOT NULL,
  usedCapacity INT DEFAULT 0,
  status NVARCHAR(20) DEFAULT 'ACTIVE',
  temperatureControlled BIT DEFAULT 0,
  minTemperature FLOAT NULL,
  maxTemperature FLOAT NULL,
  createdAt DATETIME DEFAULT GETDATE()
);
