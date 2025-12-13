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
            layer => layer.name === 'Rooms'
        );

        if (!roomsLayer || !roomsLayer.objects) {
            console.error('No Rooms layer found in map definition');
            return rooms;
        }

        roomsLayer.objects.forEach(roomObj => {
            rooms[roomObj.name] = {
                name: roomObj.name,
                polygon: roomObj.polygon,
                x: roomObj.x,
                y: roomObj.y,
                imagePath: `./assets/rooms/${roomObj.name}.jpg`,
                bounds: this.calculateBounds(roomObj.polygon, roomObj.x, roomObj.y)
            };
        });

        return rooms;
    }

    /**
     * Calculate bounding box for a room polygon
     */
    calculateBounds(polygon, offsetX, offsetY) {
        let minX = Infinity, minY = Infinity;
        let maxX = -Infinity, maxY = -Infinity;

        polygon.forEach(point => {
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
            centerY: (minY + maxY) / 2
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
}