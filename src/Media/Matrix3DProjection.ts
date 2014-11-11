/// <reference path="Projection.ts" />

module Fayde.Media {
    export class Matrix3DProjection extends Projection {
        static ProjectionMatrixProperty = DependencyProperty.Register("ProjectionMatrix", () => Matrix3D, Matrix3DProjection, undefined, (d: Projection, args) => d.InvalidateProjection());
        ProjectionMatrix: Matrix3D;

        CreateProjectionMatrix(): Matrix3D { return this.ProjectionMatrix; }
    }
    Fayde.RegisterType(Matrix3DProjection, "Fayde.Media", Fayde.XMLNS);
}