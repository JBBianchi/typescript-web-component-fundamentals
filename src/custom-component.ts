/** Generic */
type KeyOfComponent<TComponent> = keyof Omit<TComponent, keyof HTMLElement>;

type ObservedAttributesMapping<TComponent extends HTMLElement> = {
  [key: string]: KeyOfComponent<TComponent>;
};

type PropertiesEventTypeMapping<TComponent extends HTMLElement> = {
  [key in KeyOfComponent<TComponent>]?: string;
};

interface IWebComponent {
  connectedCallback(): void;
  adoptedCallback(): void;
  disconnectedCallback(): void;
  attributeChangedCallback(
    attribute: string,
    previousValue: any,
    currentValue: any
  ): void;
}

interface ChangeEventArgs<T = any> {
  property: string;
  value: T;
}

const functionType = typeof function () {};
const stringType = typeof "";

type EventHandler<T = any> = (evt: CustomEvent<T>) => void;

const noop: EventHandler = (evt: CustomEvent): void => {};
/** */

import { BehaviorSubject, Subject, takeUntil, tap } from "rxjs";

const customComponentTag = "custom-component";

const observedAttributesMapping: ObservedAttributesMapping<CustomComponent> = {
  "matching-attribute": "ownProp",
  "other-attr": "otherProp",
  "on-change": "onChange",
};

const propertiesEventTypeMapping: PropertiesEventTypeMapping<CustomComponent> =
  {
    onChange: "propertyChanged",
  };
export default class CustomComponent
  extends HTMLElement
  implements IWebComponent
{
  static get tag(): string {
    return customComponentTag;
  }
  static define(): void {
    customElements.define(CustomComponent.tag, CustomComponent);
  }
  static get observedAttributes(): Array<string> {
    return Object.keys(observedAttributesMapping);
  }
  private root: ShadowRoot;
  private disconnectNotifier = new Subject<null>();
  ownProp: BehaviorSubject<string> = new BehaviorSubject<string>("");
  private _otherProp: string = "";
  set otherProp(value: string) {
    this._otherProp = value;
    this.emitChange("otherProp", value);
  }
  get otherProp(): string {
    return this._otherProp;
  }
  onChange: EventHandler<ChangeEventArgs> = noop;

  constructor() {
    super();
    this.root = this.attachShadow({ mode: "closed" }); // keeps track of the shadowRoot even if its closed
    this.ownProp
      .pipe(
        tap((value) => this.emitChange("ownProp", value)),
        takeUntil(this.disconnectNotifier)
      )
      .subscribe();
  }
  adoptedCallback(): void {}
  connectedCallback(): void {
    if (!this.root.isConnected) {
      return;
    }
  }
  disconnectedCallback(): void {
    this.ownProp.complete();
    Object.entries(propertiesEventTypeMapping).forEach(
      ([property, eventType]) => {
        const listener = this[
          property as KeyOfComponent<CustomComponent>
        ] as EventListener;
        if (!!listener && listener !== noop) {
          this.removeEventListener(eventType, listener);
        }
      }
    );
    this.disconnectNotifier.next(null);
    this.disconnectNotifier.complete();
  }
  attributeChangedCallback(
    attribute: string,
    previousValue: any,
    currentValue: any
  ): void {
    if (previousValue === currentValue) return;
    const property = observedAttributesMapping[attribute];
    if (!property) {
      console.warn(`Unable to map attribute '${attribute}' to a property.`);
      return;
    }
    if (this[property] instanceof BehaviorSubject<any>) {
      const subject = this[property] as BehaviorSubject<any>;
      if (subject.value === currentValue) {
        return;
      }
      (this[property] as BehaviorSubject<any>).next(currentValue);
      return;
    } else if (typeof this[property] === functionType) {
      // event handler
      const eventType = propertiesEventTypeMapping[property];
      if (!eventType) {
        console.warn(`Unable to map property '${attribute}' to an event type.`);
        return;
      }
      if (!currentValue) {
        currentValue = noop;
      }
      if (this[property] === currentValue) {
        return;
      }
      if (this[property] !== noop) {
        this.removeEventListener(eventType, this[property] as EventListener);
      }
      if (typeof currentValue !== functionType) {
        if (typeof currentValue !== stringType) {
          console.warn(``);
          return;
        }
        currentValue = eval(currentValue).bind(this);
      }
      this[property] = currentValue;
      this.addEventListener(eventType, this[property] as EventListener);
      return;
    }
    if (this[property] !== currentValue) {
      this[property] = currentValue;
    }
  }
  private emitChange(property: string, value: any) {
    this.dispatchEvent(
      new CustomEvent<ChangeEventArgs>("propertyChanged", {
        bubbles: true,
        cancelable: true,
        detail: {
          property,
          value,
        },
      })
    );
  }
}

customElements.define(customComponentTag, CustomComponent);
