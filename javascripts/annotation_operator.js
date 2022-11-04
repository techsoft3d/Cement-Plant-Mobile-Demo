class AnnotationOperator {
    constructor(viewer, msgs) {
        this._viewer = viewer;
        this._msgs = msgs;
        this._annotationMap = {};
        this._activeMarkup = false;
        this._activeMarkupHandle = "";
        this._previousAnchorPlaneDragPoint;
        this._isClicked = 0;
    };

    _onStart(event) {
        var _this = this;

        var downPosition = event.getPosition();
        if (!this._selectAnnotation(downPosition)) {
            var config = new Communicator.PickConfig(Communicator.SelectionMask.Face);
            this._viewer.getView().pickFromPoint(event.getPosition(), config).then(function (selectionItem) {
                var nodeId = selectionItem.getNodeId();
                if (nodeId > 0) {
                    var selectionPosition = selectionItem.getPosition();
                    var annotationMarkup = new AnnotationMarkup(_this._viewer, selectionPosition, "", selectionPosition);
                    var markupHandle = _this._viewer.getMarkupManager().registerMarkup(annotationMarkup);
                    _this._annotationMap[markupHandle] = annotationMarkup;

                    _this._activeMarkup = annotationMarkup;
                    _this._activeMarkupHandle = markupHandle;
                    _this._previousAnchorPlaneDragPoint = _this._getDragPointOnAnchorPlane(downPosition);                
                }
            });
        }
        event.setHandled(true);
    }

    onMouseDown(event) {
        var _this = this;

        var mouseButton = event.getButton();
        if (mouseButton != Communicator.Button.Left)
            return;
        _this._onStart(event);
    }

    onTouchStart(event) {
        var _this = this;

        _this._onStart(event);
    }

    _selectAnnotation(selectPoint) {
        var _this = this;

        var markup = this._viewer.getMarkupManager().pickMarkupItem(selectPoint);
        if (markup) {
            this._activeMarkup = markup;
            this._previousAnchorPlaneDragPoint = this._getDragPointOnAnchorPlane(selectPoint);
            _this._isClicked = 0;
            return true;
        } else {
            return false;
        }

    }

    _onMove(event) {
        var _this = this;

        if (this._activeMarkup) {
            var currentAnchorPlaneDragPoint = this._getDragPointOnAnchorPlane(event.getPosition());
            var dragDelta = Communicator.Point3.subtract(currentAnchorPlaneDragPoint, this._previousAnchorPlaneDragPoint);
            var newAnchorPos = this._activeMarkup.getTextBoxAnchor().add(dragDelta);
            this._activeMarkup.setTextBoxAnchor(newAnchorPos);
            this._previousAnchorPlaneDragPoint.assign(currentAnchorPlaneDragPoint);
            this._viewer.getMarkupManager().refreshMarkup();
            if (_this._activeMarkupHandle == "")
                _this._isClicked++;

        }
        event.setHandled(true);
    }

    onMouseMove(event) {
        var _this = this;

       _this._onMove(event);
    }

    onTouchMove(event) {
        var _this = this;

        _this._onMove(event);
    }

    _onEnd(event) {
        var _this = this;

        if (_this._activeMarkup && _this._isClicked <= 5) {
            var label = window.prompt(_this._msgs.annotation, _this._activeMarkup.getLabel());
            if(label == null){
                _this._viewer.getMarkupManager().unregisterMarkup(_this._activeMarkupHandle);
                delete _this._annotationMap[_this._activeMarkupHandle];
            } else {
                _this._activeMarkup.setLabel(label)
                _this._activeMarkup.setValues();
                _this._viewer.getMarkupManager().refreshMarkup();
            }
        }
        _this._activeMarkup = false;
        _this._activeMarkupHandle = "";
        _this._isClicked = 0;
        
        event.setHandled(true);
    }

    onMouseUp(event) {
        var _this = this;

        _this._onEnd(event);
    }

    onTouchEnd(event) {
        var _this = this;

        _this._onEnd(event);
    }

    _getDragPointOnAnchorPlane(screenPoint) {
        var anchor = this._activeMarkup.getLeaderLineAnchor();
        var camera = this._viewer.getView().getCamera();
        var normal = Communicator.Point3.subtract(camera.getPosition(), anchor).normalize();
        var anchorPlane = Communicator.Plane.createFromPointAndNormal(anchor, normal);
        var raycast = this._viewer.getView().raycastFromPoint(screenPoint);
        var intersectionPoint = Communicator.Point3.zero();
        if (anchorPlane.intersectsRay(raycast, intersectionPoint)) {
            return intersectionPoint;
        }
        else {
            return null;
        }
    }

    serialize() {
        var _this = this;
        var annotations = [];
        for (var key in _this._annotationMap) {
            var annot = _this._annotationMap[key];
            annotations.push(annot.selialize());
        }
        return annotations;
    }

    createMarkup(label, labelAncor, textBoxAncor) {
        var _this = this;
        var annotationMarkup = new AnnotationMarkup(_this._viewer, labelAncor, label, textBoxAncor);
        var markupHandle = _this._viewer.getMarkupManager().registerMarkup(annotationMarkup);
        _this._annotationMap[markupHandle] = annotationMarkup;
    }

    deleteAll() {
        var _this = this;
        var MM = _this._viewer.getMarkupManager();
        for (var key in _this._annotationMap) {
            MM.unregisterMarkup(key);
            delete _this._annotationMap[key];
        }
    }
}

var AnnotationMarkup = function(viewer, anchorPoint, label, textBoxPoint) {
    this._leaderLine = new Communicator.Markup.Shape.Line();
    this._text1 = new Communicator.Markup.Shape.Text();
    this._frame = new Communicator.Markup.Shape.Rectangle();
    this._frame.setFillOpacity(1);
    this._frame.setFillColor(new Communicator.Color(255, 255, 255));
    this._viewer = viewer;
    this._leaderAnchor = anchorPoint.copy();
    this._textBoxAnchor = textBoxPoint.copy();
    this._text1.setText(label);
    this._leaderLine.setStartEndcapType(Communicator.Markup.Shape.EndcapType.Arrowhead);
    this.setValues();
};

AnnotationMarkup.prototype = {
    draw: function () {
        this._behindView = false;
        var leaderPoint3d = this._viewer.getView().projectPoint(this._leaderAnchor);
        var boxAnchor3d = this._viewer.getView().projectPoint(this._textBoxAnchor);
        if (leaderPoint3d.z <= 0.0)
            this._behindView = true;
        if (boxAnchor3d.z <= 0.0)
            this._behindView = true;
        var leaderPoint2d = Communicator.Point2.fromPoint3(leaderPoint3d);
        var boxAnchor2d = Communicator.Point2.fromPoint3(boxAnchor3d);

        var frameSize = this._frame.getSize();

        var leaderEnd = boxAnchor2d.copy();
        if ((boxAnchor2d.x + frameSize.x / 2) < leaderPoint2d.x) {
            leaderEnd.x += frameSize.x;
        }
        if ((boxAnchor2d.y - frameSize.y / 2) < leaderPoint2d.y) {
            leaderEnd.y += frameSize.y;
        }
        this._leaderLine.set(leaderPoint2d, leaderEnd);

        var textAncor = boxAnchor2d.copy();
        textAncor.x += 1;
        textAncor.y += 1;
        this._text1.setPosition(textAncor);
        this._frame.setPosition(boxAnchor2d);
        var renderer = this._viewer.getMarkupManager().getRenderer();
        renderer.drawRectangle(this._frame);
        renderer.drawLine(this._leaderLine);
        renderer.drawText(this._text1);
    },

    hit: function (point) {
        var measurement = this._frame.getSize();
        var position = this._text1.getPosition();
        if (point.x < position.x)
            return false;
        if (point.x > position.x + measurement.x)
            return false;
        if (point.y < position.y)
            return false;
        if (point.y > position.y + measurement.y)
            return false;
        return true;
    },

    getLeaderLineAnchor: function () {
        return this._leaderAnchor.copy();
    },

    getTextBoxAnchor: function () {
        return this._textBoxAnchor;
    },

    setTextBoxAnchor: function (newAnchorPoint) {
        this._textBoxAnchor.assign(newAnchorPoint);
    },

    getLabel: function () {
        return this._text1.getText();
    },

    setLabel: function (label) {
        this._text1.setText(label);
    },

    selialize: function () {
        return {
            label: this.getLabel(),
            leaderAnchor: this._leaderAnchor.forJson(),
            textBoxAnchor: this._textBoxAnchor.forJson(),
        };
    },

    setValues: function() {
        var renderer = this._viewer.getMarkupManager().getRenderer();
        var measure1 = renderer.measureText(this._text1.getText(), this._text1);
        this._frame.setSize(new Communicator.Point2(measure1.x + 4, measure1.y + 6));
    }
}