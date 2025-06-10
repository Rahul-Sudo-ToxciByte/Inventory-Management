// Data management for the inventory system
const inventoryOperations = {
    // Get all items from localStorage
    getAllItems() {
        return JSON.parse(localStorage.getItem('inventory')) || [];
    },

    // Add a new item
    addItem(item) {
        const items = this.getAllItems();
        items.push(item);
        localStorage.setItem('inventory', JSON.stringify(items));
        return items;
    },

    // Update an existing item
    updateItem(id, updatedItem) {
        const items = this.getAllItems();
        const index = items.findIndex(item => item.id === id);
        if (index !== -1) {
            items[index] = { ...items[index], ...updatedItem };
            localStorage.setItem('inventory', JSON.stringify(items));
        }
        return items;
    },

    // Delete an item
    deleteItem(id) {
        const items = this.getAllItems();
        const filteredItems = items.filter(item => item.id !== id);
        localStorage.setItem('inventory', JSON.stringify(filteredItems));
        return filteredItems;
    },

    // Get item by ID
    getItemById(id) {
        const items = this.getAllItems();
        return items.find(item => item.id === id);
    },

    // Update item quantity
    updateQuantity(id, quantity) {
        const items = this.getAllItems();
        const index = items.findIndex(item => item.id === id);
        if (index !== -1) {
            items[index].quantity = quantity;
            // Update status based on quantity
            if (quantity === 0) {
                items[index].status = "Out of Stock";
            } else if (quantity < 10) {
                items[index].status = "Low Stock";
            } else {
                items[index].status = "In Stock";
            }
            localStorage.setItem('inventory', JSON.stringify(items));
        }
        return items;
    }
}; 