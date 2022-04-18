export class Container {

    public container = [];

    constructor() {
    }

    add(name, object) {
        this.container[name] = object;
    }

    get(moduleName: string) {
        return this.container[moduleName];
    }

    getAllModules() {
        return this.container;
    }
}
