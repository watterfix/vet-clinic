class ProductController {
    constructor(productModel, userModel) {
        this.productModel = productModel;
        this.userModel = userModel;
        this.init();
    }

    init() {
        window.productController = this;

        if (window.location.pathname.includes('characteristics.html')) {
            this.renderProducts();
        }
    }

    async renderProducts() {
        const container = document.querySelector('#productsContainer');
        if (!container) return;

        const products = this.productModel.getProducts();
        const isAdmin = this.userModel.isAdmin();

        container.innerHTML = ProductView.renderProducts(
            products,
            isAdmin,
            (name, price) => window.cartController?.addToCart(name, price),
            (id) => this.updatePrice(id)
        );
    }

    async refreshPrices() {
        await this.productModel.loadProducts();
        await this.renderProducts();
        NotificationView.show('Цены обновлены', 'success');
    }

    async updatePrice(productId) {
        if (!this.userModel.isAdmin()) {
            NotificationView.show('Только администратор может изменять цены!', 'error');
            return;
        }

        const priceInput = document.getElementById(`price-${productId}`);
        if (!priceInput) return;

        const newPrice = parseInt(priceInput.value);
        if (isNaN(newPrice) || newPrice <= 0) {
            NotificationView.show('Введите корректную цену', 'error');
            return;
        }

        try {
            await this.productModel.updateProduct(productId, { price: newPrice });
            NotificationView.show('Цена успешно обновлена!', 'success');
            await this.renderProducts();
        } catch (error) {
            NotificationView.show(error.message, 'error');
        }
    }

    async getAllProducts() {
        return this.productModel.getProducts();
    }
}

window.ProductController = ProductController;