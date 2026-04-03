class ProductModel {
    constructor(dbManager) {
        this.db = dbManager;
        this.products = [];
    }

    async loadProducts() {
        await this.db.waitForInit();
        this.products = await this.db.getAll('products');
        return this.products;
    }

    getProducts() {
        return this.products;
    }

    getProductsByCategory(category) {
        return this.products.filter(p => p.category === category);
    }

    async addProduct(productData) {
        const userModel = new UserModel(this.db);
        if (!userModel.isAdmin()) {
            throw new Error('Только администратор может добавлять товары');
        }

        const newProduct = await this.db.insert('products', productData);
        await this.loadProducts();
        this.db.broadcastUpdate('products');
        return newProduct;
    }

    async updateProduct(id, updates) {
        const userModel = new UserModel(this.db);
        if (!userModel.isAdmin()) {
            throw new Error('Только администратор может изменять товары');
        }

        const updated = await this.db.update('products', id, updates);
        await this.loadProducts();
        this.db.broadcastUpdate('products');
        return updated;
    }

    async deleteProduct(id) {
        const userModel = new UserModel(this.db);
        if (!userModel.isAdmin()) {
            throw new Error('Только администратор может удалять товары');
        }

        await this.db.delete('products', id);
        await this.loadProducts();
        this.db.broadcastUpdate('products');
        return true;
    }

    getProductById(id) {
        return this.products.find(p => p.id == id);
    }
}

window.ProductModel = ProductModel;