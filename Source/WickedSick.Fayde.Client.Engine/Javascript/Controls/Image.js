﻿/// <reference path="../Core/FrameworkElement.js"/>
/// CODE
/// <reference path="../Media/ImageSource.js"/>
/// <reference path="Enums.js"/>
/// <reference path="../Primitives/Rect.js"/>
/// <reference path="../Primitives/Enums.js"/>
/// <reference path="../Media/Enums.js"/>
/// <reference path="../Primitives/Uri.js"/>
/// <reference path="../Media/Imaging/BitmapImage.js"/>

//#region Image
Fayde.Image = Nullstone.Create("Image", FrameworkElement);

Fayde.Image.Instance.Init = function () {
    this.Init$FrameworkElement();
    this.ImageFailed = new MulticastEvent();
    this.ImageOpened = new MulticastEvent();
};

//#region Dependency Properties

Fayde.Image.SourceProperty = DependencyProperty.RegisterFull("Source", function () { return ImageSource; }, Fayde.Image, null, { GetValue: function (propd, obj) { return new BitmapImage(); } });
Fayde.Image.Instance.GetSource = function () {
    ///<returns type="ImageSource"></returns>
    return this.GetValue(Fayde.Image.SourceProperty);
};
Fayde.Image.Instance.SetSource = function (value) {
    ///<param name="value" type="ImageSource"></param>
    value = this.SetSource.Converter(value);
    this.SetValue(Fayde.Image.SourceProperty, value);
};
Fayde.Image.Instance.SetSource.Converter = function (value) {
    if (value instanceof Uri)
        return new BitmapImage(value);
    return value;
};

Fayde.Image.StretchProperty = DependencyProperty.RegisterCore("Stretch", function () { return Number; }, Fayde.Image, Stretch.Uniform);
Fayde.Image.Instance.GetStretch = function () {
    ///<returns type="Number"></returns>
    return this.GetValue(Fayde.Image.StretchProperty);
};
Fayde.Image.Instance.SetStretch = function (value) {
    ///<param name="value" type="Number"></param>
    this.SetValue(Fayde.Image.StretchProperty, value);
};

//#endregion

//#region Measure

Fayde.Image.Instance._MeasureOverrideWithError = function (availableSize, error) {
    /// <param name="availableSize" type="Size"></param>
    var desired = availableSize;
    var shapeBounds = new Rect();
    var source = this.GetSource();
    var sx = sy = 0.0;

    if (source != null)
        shapeBounds = new Rect(0, 0, source.GetPixelWidth(), source.GetPixelHeight());

    if (!isFinite(desired.Width))
        desired.Width = shapeBounds.Width;
    if (!isFinite(desired.Height))
        desired.Height = shapeBounds.Height;

    if (shapeBounds.Width > 0)
        sx = desired.Width / shapeBounds.Width;
    if (shapeBounds.Height > 0)
        sy = desired.Height / shapeBounds.Height;

    if (!isFinite(availableSize.Width))
        sx = sy;
    if (!isFinite(availableSize.Height))
        sy = sx;

    switch (this.GetStretch()) {
        case Stretch.Uniform:
            sx = sy = Math.min(sx, sy);
            break;
        case Stretch.UniformToFill:
            sx = sy = Math.max(sx, sy);
            break;
        case Stretch.Fill:
            if (!isFinite(availableSize.Width))
                sx = sy;
            if (!isFinite(availableSize.Height))
                sy = sx;
            break;
        case Stretch.None:
            sx = sy = 1.0;
            break;
    }

    desired = new Size(shapeBounds.Width * sx, shapeBounds.Height * sy);

    return desired;
};

//#endregion

//#region Arrange

Fayde.Image.Instance._ArrangeOverrideWithError = function (finalSize, error) {
    /// <param name="finalSize" type="Size"></param>
    var arranged = finalSize;
    var shapeBounds = new Rect();
    var source = this.GetSource();
    var sx = 1.0;
    var sy = 1.0;

    if (source != null)
        shapeBounds = new Rect(0, 0, source.GetPixelWidth(), source.GetPixelHeight());

    if (shapeBounds.Width === 0)
        shapeBounds.Width = arranged.Width;
    if (shapeBounds.Height === 0)
        shapeBounds.Height = arguments.Height;

    if (shapeBounds.Width !== arranged.Width)
        sx = arranged.Width / shapeBounds.Width;
    if (shapeBounds.Height !== arranged.Height)
        sy = arranged.Height / shapeBounds.Height;

    switch (this.GetStretch()) {
        case Stretch.Uniform:
            sx = sy = Math.min(sx, sy);
            break;
        case Stretch.UniformToFill:
            sx = sy = Math.max(sx, sy);
            break;
        case Stretch.None:
            sx = sy = 1.0;
            break;
        default:
            break;
    }

    arranged = new Size(shapeBounds.Width * sx, shapeBounds.Height * sy);

    return arranged;
};

//#endregion

Fayde.Image.Instance._Render = function (ctx, region) {
    // Just to get something working, we do all the matrix transforms for stretching.
    // Eventually, we can let the html5 canvas do all the dirty work.

    var source = this.GetSource();
    if (source == null)
        return;

    var stretch = this.GetStretch();
    var specified = new Size(this.GetActualWidth(), this.GetActualHeight());
    var stretched = this._ApplySizeConstraints(specified);
    var adjust = !Rect.Equals(specified, this._GetRenderSize());

    source.Lock();

    var pixelWidth = source.GetPixelWidth();
    var pixelHeight = source.GetPixelHeight();
    if (pixelWidth === 0 || pixelHeight === 0) {
        source.Unlock();
        return;
    }

    if (stretch !== Stretch.UniformToFill)
        specified = specified.Min(stretched);

    var paint = new Rect(0, 0, specified.Width, specified.Height);
    var image = new Rect(0, 0, pixelWidth, pixelHeight);

    if (stretch === Stretch.None)
        paint = paint.Union(image);

    var matrix = Fayde.Image.ComputeMatrix(paint.Width, paint.Height, image.Width, image.Height,
        stretch, AlignmentX.Center, AlignmentY.Center);

    if (adjust) {
        var error = new BError();
        this._MeasureOverrideWithError(specified, error);
        paint = new Rect((stretched.Width - specified.Width) * 0.5, (stretched.Height - specified.Height) * 0.5, specified.Width, specified.Height);
    }

    var overlap = RectOverlap.In;
    if (stretch === Stretch.UniformToFill || adjust) {
        var bounds = new Rect(paint.RoundOut());
        var box = image.Transform(matrix).RoundIn();
        overlap = bounds.RectIn(box);
    }

    ctx.Save();
    if (overlap !== RectOverlap.In || this._HasLayoutClip())
        this._RenderLayoutClip(ctx);
    ctx.Transform(matrix);
    ctx.CustomRender(Fayde.Image._ImagePainter, source._Image);
    ctx.Restore();

    source.Unlock();
};

Fayde.Image.Instance._OnSubPropertyChanged = function (propd, sender, args) {
    if (propd != null && (propd._ID === Fayde.Image.SourceProperty._ID)) {
        this._InvalidateMeasure();
        this._Invalidate();
        return;
    }
};
Fayde.Image.Instance._OnPropertyChanged = function (args, error) {
    if (args.Property.OwnerType !== FrameworkElement) {
        this._OnPropertyChanged$FrameworkElement(args, error);
        return;
    }

    if (args.Property._ID === Fayde.Image.SourceProperty._ID) {
        var oldBmpSrc = Nullstone.As(args.OldValue, BitmapSource);
        if (oldBmpSrc != null) {
            oldBmpSrc._ErroredCallback = null;
            oldBmpSrc._LoadedCallback = null;
        }
        var newBmpSrc = Nullstone.As(args.NewValue, BitmapSource);
        if (newBmpSrc != null) {
            var i = this;
            newBmpSrc._ErroredCallback = function () { i.ImageFailed.Raise(this, new EventArgs()); };
            newBmpSrc._LoadedCallback = function () { i.ImageOpened.Raise(this, new EventArgs()); };
        } else {
            this._UpdateBounds();
            this._Invalidate();
        }
        this._InvalidateMeasure();
    }

    this.PropertyChanged.Raise(this, args);
};

Fayde.Image.ComputeMatrix = function (width, height, sw, sh, stretch, alignX, alignY) {
    /// <param name="width" type="Number"></param>
    /// <param name="height" type="Number"></param>
    /// <param name="sw" type="Number"></param>
    /// <param name="sh" type="Number"></param>
    /// <param name="stretch" type="Stretch"></param>
    /// <param name="alignX" type="Number"></param>
    /// <param name="alignY" type="Number"></param>
    /// <returns type="Matrix" />

    var sx = width / sw;
    var sy = height / sh;
    if (width === 0)
        sx = 1.0;
    if (height === 0)
        sy = 1.0;

    if (stretch === Stretch.Fill) {
        return new ScalingMatrix(sx, sy);
    }

    var scale = 1.0;
    var dx = 0.0;
    var dy = 0.0;
    switch (stretch) {
        case Stretch.Uniform:
            scale = sx < sy ? sx : sy;
            break;
        case Stretch.UniformToFill:
            scale = sx < sy ? sy : sx;
            break;
        case Stretch.None:
            break;
    }

    switch (alignX) {
        case AlignmentX.Left:
            dx = 0.0;
            break;
        case AlignmentX.Center:
            dx = (width - (scale * sw)) / 2;
            break;
        case AlignmentX.Right:
        default:
            dx = width - (scale * sw);
            break;
    }

    switch (alignY) {
        case AlignmentY.Top:
            dy = 0.0;
            break;
        case AlignmentY.Center:
            dy = (height - (scale * sh)) / 2;
            break;
        case AlignmentY.Bottom:
        default:
            dy = height - (scale * sh);
            break;
    }
    return new Matrix([scale, 0, dx, 0, scale, dy],
        [1 / scale, 0, -dx, 0, 1 / scale, -dy]);
};
Fayde.Image._ImagePainter = function (args) {
    var ctx = args[0];
    var img = args[1];
    ctx.drawImage(img, 0, 0);
};

Nullstone.FinishCreate(Fayde.Image);
//#endregion