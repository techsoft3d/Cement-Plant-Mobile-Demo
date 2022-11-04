class OrbitCtrlOperator {
    constructor(viewer) {
        this._viewer = viewer;
        this._markupHandle;
    }

    _onStart(event) {
        var _this = this;

        var pickConfig = new Communicator.PickConfig(Communicator.SelectionMask.Face);
        _this._viewer.getView().pickFromPoint(event.getPosition(), pickConfig).then(function (selectionItem) {
            var nodeId = selectionItem.getNodeId();

            if (nodeId > 0) {
                _this._onEnd();
                
                var selectionPosition = selectionItem.getPosition();
                var orbitOp = _this._viewer.getOperatorManager().getOperator(Communicator.OperatorId.Orbit);
                orbitOp.setOrbitFallbackMode(Communicator.OrbitFallbackMode.OrbitTarget);
                orbitOp.setOrbitTarget(selectionPosition);
                
                var markupItem = new crossMarkup(_this._viewer, selectionPosition);
                _this._markupHandle = _this._viewer.getMarkupManager().registerMarkup(markupItem);
            }
        });
    }

    _onEnd() {
        var _this = this;
        var orbitOp = _this._viewer.getOperatorManager().getOperator(Communicator.OperatorId.Orbit);
        orbitOp.setOrbitFallbackMode(Communicator.OrbitFallbackMode.ModelCenter);

        if (_this._markupHandle != undefined) {
            _this._viewer.getMarkupManager().unregisterMarkup(_this._markupHandle);
            _this._markupHandle = undefined;
        }

    }

    onTouchStart(event) {
        var _this = this;

        _this._onStart(event);
    }

    onTouchEnd(event) {
        var _this = this;

        _this._onEnd();
    }

    onMouseDown(event) {
        var _this = this;

        var mouseButton = event.getButton();
        if (mouseButton != Communicator.Button.Left)
            return;

        _this._onStart(event);
    }

    onMouseUp(event) {
        var _this = this;

        _this._onEnd();
    }
}

var crossMarkup = function(viewer, point) {
    this._viewer = viewer;
    this._point = point.copy();
    this._line1 = new Communicator.Markup.Shape.Line();
    this._line2 = new Communicator.Markup.Shape.Line();
    this._line1.setStrokeColor(new Communicator.Color(255, 0, 0));
    this._line2.setStrokeColor(new Communicator.Color(255, 0, 0));
};

crossMarkup.prototype = {
    draw: function () {
        var _this = this;
        var p_st = Communicator.Point2.fromPoint3(_this._viewer.getView().projectPoint(_this._point));
        var p_en = Communicator.Point2.fromPoint3(_this._viewer.getView().projectPoint(_this._point));

        var size = 5;

        var p1_st = p_st.copy();
        var p1_en = p_en.copy();
        p1_st.x -= size;
        p1_en.x += size;
        _this._line1.set(p1_st, p1_en);

        var p2_st = p_st.copy();
        var p2_en = p_en.copy();
        p2_st.y -= size;
        p2_en.y += size;
        _this._line2.set(p2_st, p2_en);

        _this._viewer.getMarkupManager().getRenderer().drawLine(_this._line1);
        _this._viewer.getMarkupManager().getRenderer().drawLine(_this._line2);
    },
};