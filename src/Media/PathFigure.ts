/// <reference path="../Core/DependencyObject.ts" />
/// <reference path="../Core/XamlObjectCollection.ts" />

module Fayde.Media {
    export class PathFigure extends DependencyObject {
        static IsClosedProperty = DependencyProperty.RegisterCore("IsClosed", () => Boolean, PathFigure, false, (d: PathFigure, args) => d.InvalidatePathFigure());
        static StartPointProperty = DependencyProperty.RegisterCore("StartPoint", () => Point, PathFigure, undefined, (d: PathFigure, args) => d.InvalidatePathFigure());
        static IsFilledProperty = DependencyProperty.RegisterCore("IsFilled", () => Boolean, PathFigure, true, (d: PathFigure, args) => d.InvalidatePathFigure());
        static SegmentsProperty = DependencyProperty.RegisterImmutable<PathSegmentCollection>("Segments", () => PathSegmentCollection, PathFigure);
        IsClosed: boolean;
        Segments: PathSegmentCollection;
        StartPoint: Point;
        IsFilled: boolean;

        private _Path: minerva.path.Path = null;

        constructor() {
            super();
            var coll = PathFigure.SegmentsProperty.Initialize(this);
            coll.AttachTo(this);
            ReactTo(coll, this, () => this.InvalidatePathFigure());
        }

        private _Build(): minerva.path.Path {
            var p = new minerva.path.Path();

            var start = this.StartPoint;
            p.move(start.x, start.y);

            var enumerator = this.Segments.getEnumerator();
            while (enumerator.moveNext()) {
                (<PathSegment>enumerator.current)._Append(p);
            }
            if (this.IsClosed)
                p.close();

            return p;
        }

        private InvalidatePathFigure() {
            this._Path = null;
            Incite(this);
        }

        MergeInto(rp: minerva.path.Path) {
            if (!this._Path)
                this._Path = this._Build();
            minerva.path.Path.Merge(rp, this._Path);
        }
    }
    Fayde.RegisterType(PathFigure, "Fayde.Media", Fayde.XMLNS);
    Xaml.Content(PathFigure, PathFigure.SegmentsProperty);

    export class PathFigureCollection extends XamlObjectCollection<PathFigure> {
        AddingToCollection(value: PathFigure, error: BError): boolean {
            if (!super.AddingToCollection(value, error))
                return false;
            ReactTo(value, this, () => Incite(this));
            Incite(this);
            return true;
        }
        RemovedFromCollection(value: PathFigure, isValueSafe: boolean) {
            super.RemovedFromCollection(value, isValueSafe);
            UnreactTo(value, this);
            Incite(this);
        }
    }
    Fayde.RegisterType(PathFigureCollection, "Fayde.Media", Fayde.XMLNS);
}