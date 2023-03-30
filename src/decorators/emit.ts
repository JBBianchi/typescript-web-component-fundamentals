const dispatchPropertyChangedEvent = (
  target: any,
  propertyName: string,
  value: any
): void => {
  target.dispatchEvent(
    new CustomEvent("propertyChanged", {
      detail: {
        propertyName,
        value,
      },
      bubbles: true,
      cancelable: true,
    })
  );
};

export function Emit() {
  return (
    target: any,
    propertyName: string,
    descriptor: PropertyDescriptor | null = null
  ) => {
    if (!descriptor) {
      const privatePropertyName = `__${String(propertyName)}`;
      descriptor = {
        get: function () {
          return (this as any)[privatePropertyName];
        },
        set: function (value: any) {
          (this as any)[privatePropertyName] = value;
          dispatchPropertyChangedEvent(this, propertyName, value);
        },
      };
      Object.defineProperty(target, propertyName, descriptor);
      return;
    }
    if (descriptor.set) {
      const set = descriptor.set;
      descriptor.set = function (value: any) {
        set.call(this, value);
        dispatchPropertyChangedEvent(
          this,
          propertyName,
          (this as any)[propertyName]
        );
      };
    }
  };
}
