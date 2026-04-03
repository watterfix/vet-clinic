class Router {
    constructor(routes) {
        this.routes = routes;
        this.init();
    }

    init() {
        window.addEventListener('load', () => this.handleRoute());
        window.addEventListener('popstate', () => this.handleRoute());
    }

    handleRoute() {
        const path = window.location.pathname;
        const route = this.routes.find(r => r.path === path);

        if (route && route.init) {
            route.init();
        }
    }

    navigate(path) {
        window.history.pushState({}, '', path);
        this.handleRoute();
    }
}

window.Router = Router;