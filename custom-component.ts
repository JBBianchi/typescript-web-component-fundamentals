import { BehaviorSubject } from "rxjs";

/** Generic */
type ObservedAttributesMapping<TComponent> = {
    [key in keyof TComponent]?: string
}

type PropertiesEventTypeMapping<TComponent> = {
    [key in keyof TComponent]?: string
}

interface IWebComponent {
    connectedCallback(): void;
    adoptedCallback(): void;
    disconnectedCallback(): void;
    attributeChangedCallback(attribute: string, previousValue: any, currentValue: any): void;
}


interface ChangeEventArgs<T = any> {
    property: string,
    newValue: T
}

const functionType = typeof function() {};
const stringType = typeof '';

type EventHandler<T = any> = (evt: CustomEvent<T>) => void;

const noop: EventHandler = (evt: CustomEvent): void => {};
/** */

const customeComponentTag = "custom-component";

const observedAttributesMapping: ObservedAttributesMapping<CustomComponent> = {
    property: 'matching-attribute', 
    possibleProp: 'other-attr',
    onChange: 'on-change'
};

const propertiesEventTypeMapping: PropertiesEventTypeMapping<CustomComponent> = {
    onChange: 'propertyChanged'
}

export class CustomComponent 
  extends HTMLElement
  implements IWebComponent
{
    static define(): void {
        customElements.define(customeComponentTag, CustomComponent);
    }
    static get observedAttributes(): Array<string> {
        return Object.values(observedAttributesMapping);
    }
    private root: ShadowRoot;
    property: BehaviorSubject<string> = new BehaviorSubject<string>("");
    possibleProp: string = "";
    onChange: EventHandler<ChangeEventArgs> = noop;

    constructor() {
        super();
        this.root = this.attachShadow({ mode: 'closed' }); // keeps track of the shadowRoot even if its closed
    }
    connectedCallback(): void {
        if (!this.root.isConnected) {
            return;
        }
    }
    adoptedCallback(): void {}
    disconnectedCallback(): void {
        // remove event listeners
    }
    attributeChangedCallback(attribute: string, previousValue: any, currentValue: any): void {
        if (previousValue !== currentValue) return;
        const propertyMatch = Object.entries(observedAttributesMapping).find(([_, attr]) => attribute === attr) as [keyof CustomComponent, string] | undefined;
        if (!propertyMatch) {
            console.warn(`Unable to map attribute '${attribute}' to a property.`);
            return;
        }
        const [property] = propertyMatch;
        if (this[property] instanceof BehaviorSubject<any>) {
            const subject = (this[property] as BehaviorSubject<any>);
            if (subject.value === currentValue) {
                return;
            }
            (this[property] as BehaviorSubject<any>).next(currentValue);
            return;
        }
        else if (typeof this[property] === functionType) {
            // event handler
            const eventTypeMatch = Object.entries(propertiesEventTypeMapping).find(([_, prop]) => property === prop) as [keyof CustomComponent, string] | undefined;
            if (!eventTypeMatch) {
                console.warn(`Unable to map property '${attribute}' to an event type.`);
                return;
            }
            const [eventType] = eventTypeMatch;
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
}