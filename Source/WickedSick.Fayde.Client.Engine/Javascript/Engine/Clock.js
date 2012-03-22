﻿/// <reference path="../Runtime/Nullstone.js"/>
/// CODE
/// <reference path="../Runtime/JsEx.js"/>

//#region Clock
var Clock = Nullstone.Create("Clock");

Clock.Instance.Init = function () {
    this._Timers = new Array();
};

Clock.Instance.RegisterTimer = function (timer) {
    if (!Array.addDistinctNullstone(this._Timers, timer))
        return;
    if (this._Timers.length === 1)
        this.RequestAnimationTick();
};
Clock.Instance.UnregisterTimer = function (timer) {
    Array.removeNullstone(this._Timers, timer);
};
Clock.Instance.DoTick = function () {
    var nowTime = new Date().getTime();
    if (!this._RunTimers(this._LastTime, nowTime)) {
        return;
    }
    this._LastTime = nowTime;
    this.RequestAnimationTick();
};
Clock.Instance._RunTimers = function (lastTime, nowTime) {
    if (this._Timers.length === 0)
        return false;
    for (var i = 0; i < this._Timers.length; i++) {
        var timer = this._Timers[i];
        timer._Tick(this._LastTime, nowTime);
    }
    return true;
};

Clock.Instance.RequestAnimationTick = function () {
    var clock = this;
    window.requestAnimFrame(function () { clock.DoTick(); });
};

Nullstone.FinishCreate(Clock);
//#endregion