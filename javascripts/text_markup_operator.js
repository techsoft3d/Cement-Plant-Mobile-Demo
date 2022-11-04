class textMarkup {
    constructor(viewer, point, text) {
        this._viewer = viewer;
        this._point = point.copy();
        
        this._text = new Communicator.Markup.Shape.Text();
        this._text.setText(text);
        this._text.setFontSize(16);
        
        this._box = new Communicator.Markup.Shape.Rectangle();
        this._box.setFillColor(new Communicator.Color(255, 255, 255));
        this._box.setFillOpacity(0.8);
        var renderer = this._viewer.getMarkupManager().getRenderer();
        var measure = renderer.measureText(this._text.getText(), this._text);
        this._box.setSize(new Communicator.Point2(measure.x + 4, measure.y + 4));
    }

    draw() {
        var _this = this;
        var point = Communicator.Point2.fromPoint3(this._viewer.getView().projectPoint(this._point));
        _this._text.setPosition(point);
        _this._box.setPosition(point);
        _this._viewer.getMarkupManager().getRenderer().drawRectangle(_this._box);
        _this._viewer.getMarkupManager().getRenderer().drawText(_this._text);
    }

    hit() {
        return false;
    }
}