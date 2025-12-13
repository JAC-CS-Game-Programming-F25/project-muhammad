export default class RoomLoader {
  /**
   * Loads and manages room data from map definition
   * @param {Object} mapDefinition - The map.json data
   */
  constructor(mapDefinition) {
    this.mapDefinition = mapDefinition;
    this.rooms = this.extractRooms();
    this.currentRoom = null;
  }

  /**
   * Extract room objects from the Rooms layer
   */
  extractRooms() {
    const rooms = {};
    const roomsLayer = this.mapDefinition.layers.find(
      (layer) => layer.name === "Rooms"
    );

    if (!roomsLayer || !roomsLayer.objects) {
      console.error("No Rooms layer found in map definition");
      return rooms;
    }

    roomsLayer.objects.forEach((roomObj) => {
      rooms[roomObj.name] = {
        name: roomObj.name,
        polygon: roomObj.polygon,
        x: roomObj.x,
        y: roomObj.y,
        imagePath: `./assets/rooms/${roomObj.name}.jpg`,
        bounds: this.calculateBounds(roomObj.polygon, roomObj.x, roomObj.y),
      };
    });

    return rooms;
  }

  /**
   * Calculate bounding box for a room polygon
   */
  calculateBounds(polygon, offsetX, offsetY) {
    let minX = Infinity,
      minY = Infinity;
    let maxX = -Infinity,
      maxY = -Infinity;

    polygon.forEach((point) => {
      const x = point.x + offsetX;
      const y = point.y + offsetY;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    });

    return {
      minX,
      minY,
      maxX,
      maxY,
      width: maxX - minX,
      height: maxY - minY,
      centerX: (minX + maxX) / 2,
      centerY: (minY + maxY) / 2,
    };
  }

  /**
   * Get room data by name
   */
  getRoom(roomName) {
    return this.rooms[roomName];
  }

  /**
   * Get all room names
   */
  getRoomNames() {
    return Object.keys(this.rooms);
  }

  /**
   * Get a random room name
   */
  getRandomRoomName() {
    const roomNames = this.getRoomNames();
    const randomIndex = Math.floor(Math.random() * roomNames.length);
    return roomNames[randomIndex];
  }

  /**
   * Set current room
   */
  setCurrentRoom(roomName) {
    if (this.rooms[roomName]) {
      this.currentRoom = roomName;
      return this.rooms[roomName];
    }
    console.error(`Room ${roomName} not found`);
    return null;
  }

  /**
   * Get current room data
   */
  getCurrentRoom() {
    return this.rooms[this.currentRoom];
  }

  /**
   * Check if a point is inside a room polygon
   * Uses point-in-polygon ray casting algorithm
   */
  isPointInRoom(x, y, roomName) {
    const room = this.rooms[roomName];
    if (!room) return false;

    const polygon = room.polygon;
    const offsetX = room.x;
    const offsetY = room.y;

    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].x + offsetX;
      const yi = polygon[i].y + offsetY;
      const xj = polygon[j].x + offsetX;
      const yj = polygon[j].y + offsetY;

      const intersect =
        yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;

      if (intersect) inside = !inside;
    }

    return inside;
  }

  /**
   * Get the room name that contains the given point
   * Returns null if not in any room
   */
  getRoomAtPosition(x, y) {
    for (const roomName in this.rooms) {
      if (this.isPointInRoom(x, y, roomName)) {
        return roomName;
      }
    }
    return null;
  }
}
