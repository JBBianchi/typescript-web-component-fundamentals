export function Emit() {
  return function (
    target: any,
    propertyName: string,
    descriptor: PropertyDescriptor | null = null
  ) {
    // console.log("target", target);
    // console.log("propertyName", propertyName);
    // console.log("descriptor", descriptor);
    const constructor = target.constructor;
    let innerValue: any = target[propertyName];
    function get(): any {
      return !!descriptor ? descriptor.value : innerValue;
    }
    function set(value: any) {
      if (!descriptor) {
        innerValue = value;
      } else if (!descriptor!.set) {
        return;
      } else {
        descriptor!.set!(value);
        innerValue = descriptor!.value;
      }
      target.dispatchEvent(
        new CustomEvent("propertyChanged", {
          detail: {
            propertyName,
            innerValue,
          },
          bubbles: true,
          cancelable: true,
        })
      );
    }
    Object.defineProperty(constructor, propertyName, {
      get,
      set,
    });
    return target;
  };
}
