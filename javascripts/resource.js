var SetResources = function(language) {
    var _this = this;
    this._captions;
    this._treeCaptions;
    this._msg;
    
    if (language == "ja") {
        this._setJa();
    } else {
        this._captions = {
            hull: "Hull",
            fit: "Fit",
            name: "Name",
            type: "Type",
            MKLink: "MKLINK address",
            system_line: "System line number",
            pipe_number_footer: "Pipe number footer",
            diameter: "Diameter",
            palette1: "Palette(1)",
            unit: "Unit",
            section: "Section",
            pressure: "Pressure",
            material: "Material",
            palette2: "Palette(2)",
            fitting_number: "Fitting number",
            list_number: "List number",
            weight: "Weight (kg)",
            center_of_mass: "Center of Mass",
            MTR: "MTR",
            NGR: "NGR",
            PSC: "PSC",
            block: "Block"
        };
        this._treeCaptions = {
            CWAY: "CWAY",
            DUCT: "DUCT",
            MACH: "MACH",
            MODL: "MODL",
            MSPA: "MSPA",
            PART: "PART",
            PIPE: "PIPE",
            RAREA: "RAREA",
            RIGG: "RIGG",
            SUPP: "SUPP",
        };
        this._msgs = {
            noResult: "Please select OK or OG.",
            saved: "Inspection result was saved.",
            annotation: "Input comment."
        };
    }
};

SetResources.prototype = {
    _setJa: function() {
        var _this = this;
        // toolbar
        $('#home-button').attr('title', 'カメラをリセット');
        $('#view-button').attr('title', 'カメラメニュー');
        $('#camera-button').attr('title', '回転');
        $('#explode-button').attr('title', '分解');
        $('#cuttingplane-button2').attr('title', 'クリップ');
        $('#cuttingPlane').attr('title', '断面表示・非表示');
        
        $('#operator-camera-walk').attr('title', 'ウォーク');
        $('#operator-camera-turntable').attr('title', 'ターンテーブル');
        $('#operator-camera-orbit').attr('title', '回転');
        
        $('#viewport-wireframe-on-shaded').attr('title', 'エッジ付きシェーディング');
        $('#viewport-shaded').attr('title', 'シェーディング');
        $('#viewport-wireframe').attr('title', 'ワイヤーフレーム');
        
        $('#view-face').attr('title', '選択した面に垂直');
        $('#view-iso').attr('title', '等角投影');
        $('#view-ortho').attr('title', '平行投影');
        $('#view-persp').attr('title', '透視投影');
        $('#view-left').attr('title', '左');
        $('#view-right').attr('title', '右');
        $('#view-bottom').attr('title', '下');
        $('#view-front').attr('title', '前');
        $('#view-back').attr('title', '後');
        $('#view-top').attr('title', '上');
        
        //
        $('.toolbarBtn[data-command="tree"]').attr('title', 'ツリー');
        $('.toolbarBtn[data-command="property"]').attr('title', 'プロパティ');
        $('.toolbarBtn[data-command="inspection"]').attr('title', '検査');
        $('.toolbarBtn[data-command="results"]').attr('title', '検査結果');
        $('.toolbarBtn[data-command="settings"]').attr('title', '設定');
        
        $('.inspectionBtn[data-command="save"]').attr('title', '保存');
        
        $('#maskBack').attr('title', 'ブロック選択に戻る');
        
        var table = document.getElementById("propatyTbl");
        var cell;
        cell = table.rows[0].cells[0].innerHTML = "名前";
        cell = table.rows[0].cells[1].innerHTML = "値";
        
        var table = document.getElementById("resultsTbl");
        var cell;
        cell = table.rows[0].cells[1].innerHTML = "ユーザー";
        cell = table.rows[0].cells[2].innerHTML = "結果";
        cell = table.rows[0].cells[3].innerHTML = "削除";
        
        $('#backgroundColorLabel').html('背景色を設定する');
        $('#walkMapLabel').html('ウォークモードでマップを表示する');
        
        this._captions = {
            hull: "船殻",
            fit: "艤装",
            name: "名称",
            type: "タイプ",
            MKLink: "MKLINKアドレス",
            system_line: "系統ライン番号",
            pipe_number_footer: "管番号追番",
            diameter: "口径",
            palette1: "パレット(1)",
            unit: "ユニット",
            section: "取り付け区分",
            pressure: "圧力",
            material: "材質",
            palette2: "パレット(2)",
            fitting_number: "フィッティング番号",
            list_number: "リスト番号",
            weight: "重量（kg）",
            center_of_mass: "重心",
            MTR: "素材区分",
            NGR: "分割番号",
            PSC: "左右舷区分",
            block: "ブロック"
        };
        this._treeCaptions = {
            CWAY: "電路",
            DUCT: "ダクト",
            MACH: "機器",
            MODL: "図形",
            MSPA: "メンテナンススペース",
            PART: "部品",
            PIPE: "管",
            RAREA: "上部干渉領域",
            RIGG: "艤装品（鉄艤品）",
            SUPP: "サポート",
        };
        this._msgs = {
            noResult: "OKまたはNGを選択してください。",
            saved: "検査結果が保存されました。",
            annotation: "コメントを入力してください。"
        };
    },
    
    getCaptions: function() {
        var _this = this;
        return _this._captions;
    },
    
    getTreeCaptions: function() {
        var _this = this;
        return _this._treeCaptions;
    },
    
    getMsgs: function() {
        var _this = this;
        return _this._msgs;
    }
};