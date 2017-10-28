import 'reflect-metadata';

export function cast(...args: any[]): any {
  if (args[0] instanceof Function) {
    return (target: any, propKey: string) => { Reflect.defineMetadata('custom:type', args[0], target, propKey); };
  }
}

export function element(...types: Function[]) {
  return (target: any, propertyKey: string) => {
    let metadataKey = 'custom:element-type0';
    for (const type of types) {
      Reflect.defineMetadata(metadataKey, type, target, propertyKey);
      metadataKey = metadataKey.replace(/(\d+)$/, (_, p1) => `${Number(p1) + 1}`);
    }
  };
}

export class TypeConverter {
  constructor(source: any) {
    const properties = Object.getOwnPropertyNames(source);
    for (const propertyKey of properties) {
      const designType = Reflect.getMetadata('design:type', this, propertyKey);
      const customType = Reflect.getMetadata('custom:type', this, propertyKey);
      const type = customType !== undefined ? customType : designType;
      this[propertyKey] = this.convert(source[propertyKey], propertyKey, type, 0);
    }
  }

  convert(source: any, propertyKey: string, type: any, depth: number) {
    if (type === undefined) { return source; }
    switch (type.name) {
      case 'Number':
        return Number(source);
      case 'String':
        return String(source);
      case 'Boolean':
        return source.toString() === 'true';
      case 'Array':
        const elementType = Reflect.getMetadata('custom:element-type' + depth, this, propertyKey) as Function;
        const nextDepth = depth + 1;
        return (source as any[]).map(el => this.convert(el, propertyKey, elementType, nextDepth));
      default:
        return new type(source);
    }
  }
}