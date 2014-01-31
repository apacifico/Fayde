/// <reference path="Fayde.d.ts" />

module Fayde.Controls.Input {
    export class UpDownParsingEventArgs<T> extends RoutedEventArgs {
        Text: string;
        Value: T = null;
        Handled: boolean = false;
        constructor(text:string) {
            super();
            Object.defineProperty(this, "Text", { value: text, writable: false });
        }
    }
}