/// <reference path="../Runtime/Nullstone.js" />
/// <reference path="SetterBase.js"/>
/// CODE

//#region Setter
var Setter = Nullstone.Create("Setter", SetterBase);

//#region DEPENDENCY PROPERTIES

Setter.PropertyProperty = DependencyProperty.Register("Property", function () { return DependencyProperty; }, Setter);

Setter.ValueProperty = DependencyProperty.Register("Value", function () { return Object; }, Setter);

Setter.ConvertedValueProperty = DependencyProperty.Register("ConvertedValue", function () { return Object; }, Setter);

//#endregion

Nullstone.FinishCreate(Setter);
//#endregion