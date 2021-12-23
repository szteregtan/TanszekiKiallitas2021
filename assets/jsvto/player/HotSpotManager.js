/**
 * Created by moo on 2016/6/27.
 *
 * update by nan on 2017/...now
 *
 * 重要更新，每个热点对象上面可以设置vr_enter和vr_leave两个方法，分别为当前vr焦点进入焦点悬停时触发vr_enter,vr焦点离开热点对象时，触发vr_leave事件
 *
 */

//配置文件JSON路径

//var TourJSONPath = "http://yx.intranet.com/vrtour/config.json";

//var TourJSONPath = "http://yx.intranet.com/vrtour/configImage.json";

//var TourJSONPath = "http://192.168.0.23:9091/v2/videos/1755/plain";

window.HotSpotManager = function (playerObj, setting, panorama) {
    this.playerObj = playerObj;   //播放器对象
    this.panorama = panorama;  //2d组件扩展对象
    this.hotSpotArr = [];  //场景热点集合
    this.hotSpotList = {}; //存放需要渲染的普通模型，每一帧会重复渲染
    this.hotSlideList = {}; //存放需要渲染的移门模型，每一帧都会重复渲染
    this.hotSpotDrawList = []; //
    this.frameTime = 0;
    this.mouseX = 0; //鼠标所在的位置
    this.mouseY = 0; //鼠标所在的位置
    this.fireTime = 2 * 1000; //vr状态触发点击事件的时间
    this.fireFocus = false;
    this.isLoading = false; //是处于加载状态
    this.playerObjCenterPTF = null; //当前播放器窗口的中心点
    this.twoPointsDistance = null; //计算当前播放器所处在的位置和窗口中心点的位置
    this.sceneArr = null; //所有场景的存储变量
    this.sceneMap = null; //所有的场景地方

    //记录当前状态的
    this.state = {
        type: "", //当前打开页面的状态
        slideDoor: {
            //移门热点相关状态
            downTime: +new Date(), //上一次点击事件时间保存
            clientX: 0, //上一次点击事件的位置存储x轴
            clientY: 0, //上一次点击事件的位置存储y轴
        },
        focus: null, //当前处于在vr状态，当前屏幕焦点的热点对象
        interval: [], //热点的定时器存储数组
    };

    //实例化个人库
    this.myExtend = this.dop = new Dop();

    //判断一下hotSpotManager文件使用的
    let imgPath;
    if (typeof vrImagePath != "undefined") {
        imgPath = vrImagePath;
    }
    else {
        imgPath = "assets/img/vto/vr/";
    }

    //个人扩展
    let toolSetting = {
        //*----------------------工具栏的相关设置----------------------------------
        tool: {
            toolBarBackground: imgPath + "black.png", //背景图的图片地址
            toolBarWidth: 280, //背景的宽度
            toolBarHeight: 70, //背景的高度
            toolBarOneIcon: imgPath + "pre.png", //第一个工具按钮的图片 上一张场景
            toolBarTwoIcon: imgPath + "thum.png", //第二个工具按钮的图片 缩略图
            toolBarThreeIcon: imgPath + "map.png", //第三个工具按钮的图片  平面地图
            toolBarFourIcon: imgPath + "next.png", //第四个工具按钮的图片 下一张图片
            toolBarIconWidth: 50, //工具栏图标的宽度
            toolBarIconHeight: 50, //工具栏图标的高度
            toolBarMoveAfterPositionPan: 180, //工具栏移动前的pan
            toolBarMoveAfterPositionTilt: -45, //工具栏移动前的tilt
            toolBarMoveMinStep: 300, //每一帧移动总距离的多少分之一
            toolBarMoveMinStepPan: 0.001, //工具栏移动最低移动pan最小值
            toolBarMoveMinStepTilt: 0.01, //工具栏移动最低移动tilt最小值
            toolBarMoveTiltCenter: -45, //工具栏和视角中心交汇的tilt
            toolBarMoveTiltRange: 30 //工具栏能够显示的范围距离交汇的多少范围内
        },
        //*----------------------工具栏thumbnail的相关设置----------------------------------
        thumbnail: {
            //thumbnail 背景
            thumbnailContentWrapWidth: 580,//弹框内容外框的宽度
            thumbnailContentWrapHeight: 360,//弹框内容外框的高度
            thumbnailContentWrapTranslateY: 0,//弹框内容外框y轴的偏移量
            thumbnailContentWrapBackgroundImageNormal: imgPath + "opacity.png",//弹框内容外框的正常背景图片
            thumbnailContentWrapBackgroundImageOver: imgPath + "opacity.png",//弹框内容外框的悬停时背景图片

            //prev 上一页按钮
            thumbnailPrevWidth: 20, //弹框左侧切换按钮宽度
            thumbnailPrevHeight: 16, //弹框左侧切换按钮高度
            thumbnailPrevBackgroundImageNormal: imgPath + "pic-prev.png", //正常状态下的弹框左侧切换按钮的背景图片
            thumbnailPrevBackgroundImageOver: imgPath + "pic-prev.png", //焦点状态下的弹框左侧切换按钮的背景显示图片
            thumbnailPrevTranslateX: -0.25, //弹框左侧切换按钮沿x轴的偏移量
            thumbnailPrevTranslateY: -0.4, //弹框左侧切换按钮沿Y轴的偏移量

            //next 下一页按钮
            thumbnailNextWidth: 20, //弹框右侧切换按钮宽度
            thumbnailNextHeight: 16, //弹框右侧切换按钮高度
            thumbnailNextBackgroundImageNormal: imgPath + "pic-next.png", //正常状态下的弹框右侧切换按钮的背景图片
            thumbnailNextBackgroundImageOver: imgPath + "pic-next.png", //焦点状态下的弹框右侧切换按钮的背景显示图片
            thumbnailNextTranslateX: 0.25, //弹框右侧切换按钮沿x轴的偏移量
            thumbnailNextTranslateY: -0.4, //弹框右侧切换按钮沿Y轴的偏移量

            //thumbnail 相关设置
            thumbnailSpaceX: 5, //缩略图水平之间的间距
            thumbnailSpaceY: 20, //缩略图垂直之间的间距
            thumbnailTitleLineHeight: 30, //缩略图标题的行高

            //悬停播放按钮
            thumbnailBtnWidth: 40, //播放按钮的宽度
            thumbnailBtnHeight: 40, //播放按钮的高度
            thumbnailBtnBackgroundImageNormal: imgPath + "play.png", //播放按钮的正常效果
            thumbnailBtnBackgroundImageOver: imgPath + "play.png", //播放按钮的悬停效果

            //显示页面分页
            thumbnailPageWidth: 80, //按钮宽度
            thumbnailPageHeight: 40, //按钮的高度
            thumbnailPageBackgroundImageNormal: imgPath + "black.png", //播放按钮的正常效果
            thumbnailPageBackgroundImageOver: imgPath + "black.png", //播放按钮的正常效果
            thumbnailPageTranslateX: 0, //弹框右侧切换按钮沿x轴的偏移量
            thumbnailPageTranslateY: -0.4, //弹框右侧切换按钮沿Y轴的偏移量

            //thumbnail的title相关设置
            thumbnailTitleColor: "#ffffff", //
            thumbnailTitleBackgroundColor: "#000000", //
            thumbnailTitleFont: "20px 'Microsoft YaHei'", //字体样式
            thumbnailTitleMove: 1 //焦点状态滚动速度
        },
        //*----------------------弹框的相关设置----------------------------------
        alert: {
            alertWidth: 600, //弹框的宽度
            alertHeight: 450, //弹框的高度
            alertBackgroundImageNormal: imgPath + "black.png", //弹框的正常背景图片
            alertBackgroundImageOver: imgPath + "black.png", //弹框的悬停时背景图片
            alertBackgroundAlpha: 0.5, // 弹框背景的透明度
            alertCloseWidth: 40, //弹框右上角关闭按钮宽度
            alertCloseHeight: 40, //弹框右上角关闭按钮高度
            alertCloseBackgroundImageNormal: imgPath + "close_normal.png", //正常状态下的关闭按钮的背景图片
            alertCloseBackgroundImageOver: imgPath + "close_normal.png", //焦点状态下的弹框关闭按钮的背景显示图片
            alertCloseTranslateX: 0.55, //弹框关闭按钮沿x轴的偏移量
            alertCloseTranslateY: 0.41 //弹框关闭按钮沿Y轴的偏移量
        },
        //*--------------------------图片热点的相关配置-----------------------------------------
        hotPic: {
            //ContentWrap 图片内容的外框
            hotPicContentWrapWidth: 580, //弹框内容外框的宽度
            hotPicContentWrapHeight: 360, //弹框内容外框的高度
            hotPicContentWrapTranslateY: 0, //弹框内容外框y轴的偏移量
            hotPicContentWrapBackgroundImageNormal: imgPath + "opacity.png", //弹框内容外框的正常背景图片
            hotPicContentWrapBackgroundImageOver: imgPath + "opacity.png", //弹框内容外框的悬停时背景图片

            //prev 上一页按钮
            hotPicPrevWidth: 20, //弹框左侧切换按钮宽度
            hotPicPrevHeight: 16, //弹框左侧切换按钮高度
            hotPicPrevBackgroundImageNormal: imgPath + "pic-prev.png", //正常状态下的弹框左侧切换按钮的背景图片
            hotPicPrevBackgroundImageOver: imgPath + "pic-prev.png", //焦点状态下的弹框左侧切换按钮的背景显示图片
            hotPicPrevTranslateX: -0.34, //弹框左侧切换按钮沿x轴的偏移量
            hotPicPrevTranslateY: -0.4, //弹框左侧切换按钮沿Y轴的偏移量

            //next 下一页按钮
            hotPicNextWidth: 20, //弹框右侧切换按钮宽度
            hotPicNextHeight: 16, //弹框右侧切换按钮高度
            hotPicNextBackgroundImageNormal: imgPath + "pic-next.png", //正常状态下的弹框右侧切换按钮的背景图片
            hotPicNextBackgroundImageOver: imgPath + "pic-next.png", //焦点状态下的弹框右侧切换按钮的背景显示图片
            hotPicNextTranslateX: 0.34, //弹框右侧切换按钮沿x轴的偏移量
            hotPicNextTranslateY: -0.4, //弹框右侧切换按钮沿Y轴的偏移量

            //Enlarge 放大按钮
            hotPicEnlargeWidth: 24, //按钮宽度
            hotPicEnlargeHeight: 24, //按钮高度
            hotPicEnlargeBackgroundImageNormal: imgPath + "pic-enlarge.png", //正常状态下的按钮的背景图片
            hotPicEnlargeBackgroundImageOver: imgPath + "pic-enlarge.png", //焦点状态下的按钮的背景显示图片
            hotPicEnlargeTranslateX: -0.04, //按钮沿x轴的偏移量
            hotPicEnlargeTranslateY: -0.4, //按钮沿Y轴的偏移量

            //Narrow 缩小按钮
            hotPicNarrowWidth: 24, //按钮宽度
            hotPicNarrowHeight: 24, //按钮高度
            hotPicNarrowBackgroundImageNormal: imgPath + "pic-narrow.png", //正常状态下的按钮的背景图片
            hotPicNarrowBackgroundImageOver: imgPath + "pic-narrow.png", //焦点状态下的按钮的背景显示图片
            hotPicNarrowTranslateX: 0.04, //按钮沿x轴的偏移量
            hotPicNarrowTranslateY: -0.4, //按钮沿Y轴的偏移量

            //Left 图片向左移动
            hotPicLeftWidth: 65, //按钮宽度
            hotPicLeftHeight: 170, //按钮高度
            hotPicLeftBackgroundImageNormal: imgPath + "pic-left.png", //正常状态下的按钮的背景图片
            hotPicLeftBackgroundImageOver: imgPath + "pic-left.png", //焦点状态下的按钮的背景显示图片
            hotPicLeftTranslateX: -0.515, //按钮沿x轴的偏移量
            hotPicLeftTranslateY: 0, //按钮沿Y轴的偏移量
            //Up 图片向上移动
            hotPicUpWidth: 350, //按钮宽度
            hotPicUpHeight: 68, //按钮高度
            hotPicUpBackgroundImageNormal: imgPath + "pic-up.png", //正常状态下的按钮的背景图片
            hotPicUpBackgroundImageOver: imgPath + "pic-up.png", //焦点状态下的按钮的背景显示图片
            hotPicUpTranslateX: 0, //按钮沿x轴的偏移量
            hotPicUpTranslateY: 0.3, //按钮沿Y轴的偏移量
            //Right 图片向右移动
            hotPicRightWidth: 65, //按钮宽度
            hotPicRightHeight: 170, //按钮高度
            hotPicRightBackgroundImageNormal: imgPath + "pic-right.png", //正常状态下的按钮的背景图片
            hotPicRightBackgroundImageOver: imgPath + "pic-right.png", //焦点状态下的按钮的背景显示图片
            hotPicRightTranslateX: 0.515, //按钮沿x轴的偏移量
            hotPicRightTranslateY: 0, //按钮沿Y轴的偏移量

            //Down 图片向下移动
            hotPicDownWidth: 350, //按钮宽度
            hotPicDownHeight: 68, //按钮高度
            hotPicDownBackgroundImageNormal: imgPath + "pic-down.png", //正常状态下的按钮的背景图片
            hotPicDownBackgroundImageOver: imgPath + "pic-down.png", //焦点状态下的按钮的背景显示图片
            hotPicDownTranslateX: 0, //按钮沿x轴的偏移量
            hotPicDownTranslateY: -0.3, //按钮沿Y轴的偏移量

            //LeftUp 图片向左上移动
            hotPicLeftUpWidth: 115, //按钮宽度
            hotPicLeftUpHeight: 95, //按钮高度
            hotPicLeftUpBackgroundImageNormal: imgPath + "pic-left-up.png", //正常状态下的按钮的背景图片
            hotPicLeftUpBackgroundImageOver: imgPath + "pic-left-up.png", //焦点状态下的按钮的背景显示图片
            hotPicLeftUpTranslateX: -0.465, //按钮沿x轴的偏移量
            hotPicLeftUpTranslateY: 0.265, //按钮沿Y轴的偏移量

            //LeftDown 图片向左下移动
            hotPicLeftDownWidth: 115, //按钮宽度
            hotPicLeftDownHeight: 95, //按钮高度
            hotPicLeftDownBackgroundImageNormal: imgPath + "pic-left-down.png", //正常状态下的按钮的背景图片
            hotPicLeftDownBackgroundImageOver: imgPath + "pic-left-down.png", //焦点状态下的按钮的背景显示图片
            hotPicLeftDownTranslateX: -0.465, //按钮沿x轴的偏移量
            hotPicLeftDownTranslateY: -0.265, //按钮沿Y轴的偏移量

            //RightUp 图片向右上移动
            hotPicRightUpWidth: 115, //按钮宽度
            hotPicRightUpHeight: 95, //按钮高度
            hotPicRightUpBackgroundImageNormal: imgPath + "pic-right-up.png", //正常状态下的按钮的背景图片
            hotPicRightUpBackgroundImageOver: imgPath + "pic-right-up.png", //焦点状态下的按钮的背景显示图片
            hotPicRightUpTranslateX: 0.465, //按钮沿x轴的偏移量
            hotPicRightUpTranslateY: 0.265, //按钮沿Y轴的偏移量

            //RightDown 图片向右下移动
            hotPicRightDownWidth: 115, //按钮宽度
            hotPicRightDownHeight: 95, //按钮高度
            hotPicRightDownBackgroundImageNormal: imgPath + "pic-right-down.png", //正常状态下的按钮的背景图片
            hotPicRightDownBackgroundImageOver: imgPath + "pic-right-down.png", //焦点状态下的按钮的背景显示图片
            hotPicRightDownTranslateX: 0.465, //按钮沿x轴的偏移量
            hotPicRightDownTranslateY: -0.265 //按钮沿Y轴的偏移量
        },
        //*--------------------------文字热点的相关配置-----------------------------------------
        hotText: {
            hotTextContentWrapWidth: 580, //弹框内容外框的宽度
            hotTextContentWrapHeight: 360, //弹框内容外框的高度
            hotTextContentWrapTranslateY: 0, //弹框内容外框y轴的偏移量
            hotTextDrawStartX: 10, //绘制字符串起始x坐标
            hotTextDrawStartY: 24, //绘制字符串起始y坐标
            hotTextLineHeight: 30, //文字的行高
            hotTextDrawWidth: 560, //文字显示的宽度
            hotTextFont: "24px 'Microsoft Yahei'", //文字样式
            hotTextColor: "#ffffff", //文字的颜色
            hotTextBackgroundColor: "#333333", //背景颜色
            hotTextMoveStep: 0.25, // 图片热点每次移动的距离

            //Up 图片向上移动
            hotTextUpWidth: 40, //按钮宽度
            hotTextUpHeight: 40, //按钮高度
            hotTextUpBackgroundImageNormal: imgPath + "up.png", //正常状态下的按钮的背景图片
            hotTextUpBackgroundImageOver: imgPath + "up.png", //焦点状态下的按钮的背景显示图片
            hotTextUpTranslateX: -0.1, //按钮沿x轴的偏移量
            hotTextUpTranslateY: -0.4, //按钮沿Y轴的偏移量

            //Down 图片向下移动
            hotTextDownWidth: 40, //按钮宽度
            hotTextDownHeight: 40, //按钮高度
            hotTextDownBackgroundImageNormal: imgPath + "down.png", //正常状态下的按钮的背景图片
            hotTextDownBackgroundImageOver: imgPath + "down.png", //焦点状态下的按钮的背景显示图片
            hotTextDownTranslateX: 0.1, //按钮沿x轴的偏移量
            hotTextDownTranslateY: -0.4 //按钮沿Y轴的偏移量
        },
        //*--------------------------模型热点的相关配置-----------------------------------------
        hotModel: {
            //ContentWrap 图片内容的外框
            hotModelContentWrapWidth: 580, //弹框内容外框的宽度
            hotModelContentWrapHeight: 360, //弹框内容外框的高度
            hotModelContentWrapTranslateY: 0, //弹框内容外框y轴的偏移量
            hotModelContentWrapBackgroundImageNormal: imgPath + "opacity.png", //弹框内容外框的正常背景图片
            hotModelContentWrapBackgroundImageOver: imgPath + "opacity.png", //弹框内容外框的悬停时背景图片
            hotModelChangeDelay: 300, //悬停切换按钮切换的延迟

            //Up 图片向上移动
            hotModelLevoclinationWidth: 290, //按钮宽度
            hotModelLevoclinationHeight: 360, //按钮高度
            hotModelLevoclinationBackgroundImageNormal: imgPath + "left.png", //正常状态下的按钮的背景图片
            hotModelLevoclinationBackgroundImageOver: imgPath + "left.png", //焦点状态下的按钮的背景显示图片
            hotModelLevoclinationTranslateX: -0.29, //按钮沿x轴的偏移量
            hotModelLevoclinationTranslateY: 0, //按钮沿Y轴的偏移量

            //Down 图片向下移动
            hotModelDextrorotationWidth: 290, //按钮宽度
            hotModelDextrorotationHeight: 360, //按钮高度
            hotModelDextrorotationBackgroundImageNormal: imgPath + "right.png", //正常状态下的按钮的背景图片
            hotModelDextrorotationBackgroundImageOver: imgPath + "right.png", //焦点状态下的按钮的背景显示图片
            hotModelDextrorotationTranslateX: 0.29, //按钮沿x轴的偏移量
            hotModelDextrorotationTranslateY: 0 //按钮沿Y轴的偏移量
        },
        //*--------------------------平面地图的相关配置-----------------------------------------
        planeMap: {
            //ContentWrap 图片内容的外框
            hotPicContentWrapWidth: 580, //弹框内容外框的宽度
            hotPicContentWrapHeight: 360, //弹框内容外框的高度
            hotPicContentWrapTranslateY: 0, //弹框内容外框y轴的偏移量
            hotPicContentWrapBackgroundImageNormal: imgPath + "opacity.png", //弹框内容外框的正常背景图片
            hotPicContentWrapBackgroundImageOver: imgPath + "opacity.png", //弹框内容外框的悬停时背景图片

            //prev 上一页按钮
            hotPicPrevWidth: 120, //弹框左侧切换按钮宽度
            hotPicPrevHeight: 40, //弹框左侧切换按钮高度
            hotPicPrevBackgroundImageNormal: imgPath + "pic-prev.png", //正常状态下的弹框左侧切换按钮的背景图片
            hotPicPrevBackgroundImageOver: imgPath + "pic-prev.png", //焦点状态下的弹框左侧切换按钮的背景显示图片
            hotPicPrevTranslateX: -0.34, //弹框左侧切换按钮沿x轴的偏移量
            hotPicPrevTranslateY: -0.4, //弹框左侧切换按钮沿Y轴的偏移量

            //next 下一页按钮
            hotPicNextWidth: 120, //弹框右侧切换按钮宽度
            hotPicNextHeight: 40, //弹框右侧切换按钮高度
            hotPicNextBackgroundImageNormal: imgPath + "pic-next.png", //正常状态下的弹框右侧切换按钮的背景图片
            hotPicNextBackgroundImageOver: imgPath + "pic-next.png", //焦点状态下的弹框右侧切换按钮的背景显示图片
            hotPicNextTranslateX: 0.34, //弹框右侧切换按钮沿x轴的偏移量
            hotPicNextTranslateY: -0.4, //弹框右侧切换按钮沿Y轴的偏移量

            //Enlarge 放大按钮
            hotPicEnlargeWidth: 24, //按钮宽度
            hotPicEnlargeHeight: 24, //按钮高度
            hotPicEnlargeBackgroundImageNormal: imgPath + "pic-enlarge.png", //正常状态下的按钮的背景图片
            hotPicEnlargeBackgroundImageOver: imgPath + "pic-enlarge.png", //焦点状态下的按钮的背景显示图片
            hotPicEnlargeTranslateX: -0.04, //按钮沿x轴的偏移量
            hotPicEnlargeTranslateY: -0.4, //按钮沿Y轴的偏移量

            //Narrow 缩小按钮
            hotPicNarrowWidth: 24, //按钮宽度
            hotPicNarrowHeight: 24, //按钮高度
            hotPicNarrowBackgroundImageNormal: imgPath + "pic-narrow.png", //正常状态下的按钮的背景图片
            hotPicNarrowBackgroundImageOver: imgPath + "pic-narrow.png", //焦点状态下的按钮的背景显示图片
            hotPicNarrowTranslateX: 0.04, //按钮沿x轴的偏移量
            hotPicNarrowTranslateY: -0.4, //按钮沿Y轴的偏移量

            //Left 图片向左移动
            hotPicLeftWidth: 65, //按钮宽度
            hotPicLeftHeight: 170, //按钮高度
            hotPicLeftBackgroundImageNormal: imgPath + "pic-left.png", //正常状态下的按钮的背景图片
            hotPicLeftBackgroundImageOver: imgPath + "pic-left.png", //焦点状态下的按钮的背景显示图片
            hotPicLeftTranslateX: -0.515, //按钮沿x轴的偏移量
            hotPicLeftTranslateY: 0, //按钮沿Y轴的偏移量

            //Up 图片向上移动
            hotPicUpWidth: 350, //按钮宽度
            hotPicUpHeight: 68, //按钮高度
            hotPicUpBackgroundImageNormal: imgPath + "pic-up.png", //正常状态下的按钮的背景图片
            hotPicUpBackgroundImageOver: imgPath + "pic-up.png", //焦点状态下的按钮的背景显示图片
            hotPicUpTranslateX: 0, //按钮沿x轴的偏移量
            hotPicUpTranslateY: 0.3, //按钮沿Y轴的偏移量

            //Right 图片向右移动
            hotPicRightWidth: 65, //按钮宽度
            hotPicRightHeight: 170, //按钮高度
            hotPicRightBackgroundImageNormal: imgPath + "pic-right.png", //正常状态下的按钮的背景图片
            hotPicRightBackgroundImageOver: imgPath + "pic-right.png", //焦点状态下的按钮的背景显示图片
            hotPicRightTranslateX: 0.515, //按钮沿x轴的偏移量
            hotPicRightTranslateY: 0, //按钮沿Y轴的偏移量

            //Down 图片向下移动
            hotPicDownWidth: 350, //按钮宽度
            hotPicDownHeight: 68, //按钮高度
            hotPicDownBackgroundImageNormal: imgPath + "pic-down.png", //正常状态下的按钮的背景图片
            hotPicDownBackgroundImageOver: imgPath + "pic-down.png", //焦点状态下的按钮的背景显示图片
            hotPicDownTranslateX: 0, //按钮沿x轴的偏移量
            hotPicDownTranslateY: -0.3, //按钮沿Y轴的偏移量

            //LeftUp 图片向左上移动
            hotPicLeftUpWidth: 115, //按钮宽度
            hotPicLeftUpHeight: 95, //按钮高度
            hotPicLeftUpBackgroundImageNormal: imgPath + "pic-left-up.png", //正常状态下的按钮的背景图片
            hotPicLeftUpBackgroundImageOver: imgPath + "pic-left-up.png", //焦点状态下的按钮的背景显示图片
            hotPicLeftUpTranslateX: -0.465, //按钮沿x轴的偏移量
            hotPicLeftUpTranslateY: 0.265, //按钮沿Y轴的偏移量

            //LeftDown 图片向左下移动
            hotPicLeftDownWidth: 115, //按钮宽度
            hotPicLeftDownHeight: 95, //按钮高度
            hotPicLeftDownBackgroundImageNormal: imgPath + "pic-left-down.png", //正常状态下的按钮的背景图片
            hotPicLeftDownBackgroundImageOver: imgPath + "pic-left-down.png", //焦点状态下的按钮的背景显示图片
            hotPicLeftDownTranslateX: -0.465, //按钮沿x轴的偏移量
            hotPicLeftDownTranslateY: -0.265, //按钮沿Y轴的偏移量

            //RightUp 图片向右上移动
            hotPicRightUpWidth: 115, //按钮宽度
            hotPicRightUpHeight: 95, //按钮高度
            hotPicRightUpBackgroundImageNormal: imgPath + "pic-right-up.png", //正常状态下的按钮的背景图片
            hotPicRightUpBackgroundImageOver: imgPath + "pic-right-up.png", //焦点状态下的按钮的背景显示图片
            hotPicRightUpTranslateX: 0.465, //按钮沿x轴的偏移量
            hotPicRightUpTranslateY: 0.265, //按钮沿Y轴的偏移量
            //RightDown 图片向右下移动
            hotPicRightDownWidth: 115, //按钮宽度
            hotPicRightDownHeight: 95, //按钮高度
            hotPicRightDownBackgroundImageNormal: imgPath + "pic-right-down.png", //正常状态下的按钮的背景图片
            hotPicRightDownBackgroundImageOver: imgPath + "pic-right-down.png", //焦点状态下的按钮的背景显示图片
            hotPicRightDownTranslateX: 0.465, //按钮沿x轴的偏移量
            hotPicRightDownTranslateY: -0.265 //按钮沿Y轴的偏移量
        },
        //*--------------------------移门热点的相关配置-----------------------------------------
        slideDoor: {
            timeDelay: 100, //图片切换的时间间隔
            moveStep: 2 //拖拽鼠标移动的总宽度的多少距离会切换完一整套图片
        },
        //*--------------------------视频热点的相关配置-----------------------------------------
        hotVideo: {
            videoContentWrapWidth: 580, //弹框内容外框的宽度
            videoContentWrapHeight: 360, //弹框内容外框的高度
            videoContentWrapTranslateY: 0, //弹框内容外框y轴的偏移量
            videoDefaultVolume: 0.6, //视频默认声音

            //音量减小键
            volumeDownWidth: 40, //按钮宽度
            volumeDownHeight: 40, //按钮高度
            volumeDownBackgroundImageNormal: imgPath + "volumeDown.png", //正常状态下的按钮的背景图片
            volumeDownBackgroundImageOver: imgPath + "volumeDown.png", //焦点状态下的按钮的背景显示图片
            volumeDownTranslateX: -0.4, //按钮沿x轴的偏移量
            volumeDownTranslateY: -0.4, //按钮沿Y轴的偏移量

            //快退按钮
            backwardWidth: 40, //按钮宽度
            backwardHeight: 40, //按钮高度
            backwardBackgroundImageNormal: imgPath + "backward.png", //正常状态下的按钮的背景图片
            backwardBackgroundImageOver: imgPath + "backward.png", //焦点状态下的按钮的背景显示图片
            backwardTranslateX: -0.2, //按钮沿x轴的偏移量
            backwardTranslateY: -0.4, //按钮沿Y轴的偏移量

            //播放暂停键
            playWidth: 40, //按钮宽度
            playHeight: 40, //按钮高度
            playBackgroundImageNormal: imgPath + "playVideo.png", //正常状态下的按钮的背景图片
            playBackgroundImageOver: imgPath + "playVideo.png", //焦点状态下的按钮的背景显示图片
            pauseBackgroundImageNormal: imgPath + "pause.png", //暂停正常状态下的按钮的背景图片
            pauseBackgroundImageOver: imgPath + "pause.png", //暂停焦点状态下的按钮的背景显示图片
            playTranslateX: 0, //按钮沿x轴的偏移量
            playTranslateY: -0.4, //按钮沿Y轴的偏移量

            //快进按钮
            forwardWidth: 40, //按钮宽度
            forwardHeight: 40, //按钮高度
            forwardBackgroundImageNormal: imgPath + "forward.png", //正常状态下的按钮的背景图片
            forwardBackgroundImageOver: imgPath + "forward.png", //焦点状态下的按钮的背景显示图片
            forwardTranslateX: 0.2, //按钮沿x轴的偏移量
            forwardTranslateY: -0.4, //按钮沿Y轴的偏移量

            //音量增加键
            volumeUpWidth: 40, //按钮宽度
            volumeUpHeight: 40, //按钮高度
            volumeUpBackgroundImageNormal: imgPath + "volumeUp.png", //正常状态下的按钮的背景图片
            volumeUpBackgroundImageOver: imgPath + "volumeUp.png", //焦点状态下的按钮的背景显示图片
            volumeUpTranslateX: 0.4, //按钮沿x轴的偏移量
            volumeUpTranslateY: -0.4 //按钮沿Y轴的偏移量
        },
        //*--------------------------canvas绘制video的相关配置-----------------------------------------
        canvasVideoSettings: {
            canvas: document.createElement("canvas"),
            hotObj: null, //play按钮的对象
            videoSrc: "", //视频文件地址---此处不可设置
            canvasWidth: 580, //canvas的宽度
            canvasHeight: 360, //canvas的高度
            videoWidth: 0, //获取视频文件的宽度
            videoHeight: 0, //获取视频文件的高度
            background: "#ffffff", //canvas的背景颜色

            //绘制专用
            video: null, //用于绘制canvas的video对象
            x: 0,	//在画布上放置图像的 x 坐标位置。
            y: 0,	//在画布上放置图像的 y 坐标位置。
            width: 0,	//可选。要使用的图像的宽度。（伸展或缩小图像）
            height: 0,	//可选。要使用的图像的高度。（伸展或缩小图像）

            //video相关配置
            volume: 0.6, //video的默认音量
            volumeTimeOut: null, //声音提示的消失延迟器
            volumeTime: 2000, //消失的延迟时间
            volumePic: imgPath + "volume.png", //音量显示图标
            volumePicWidth: 40, //音量按钮的宽度
            volumePicHeight: 40, //音量按钮的高度
            volumeStep: 0.02, //每次增加音量或减少多少音量

            //设置快进快退的相关配置
            wardStep: 1, //每帧快进或快退的幅度，单位秒
            isWard: false, //是否处于快进或快退的状态当中
            currentWard: -1, //当前的快进或快退中的位置

            //进度条的配置
            progressHeight: 3, //进度条的高度
            progressColor: "#00ffff", //进度条的颜色
            progressBgColor: "rgba(0,0,0,.3)" //进度条背景色
        },
        //*--------------------------shader的相关配置-----------------------------------------
        shader: {
            normal: null, //正常状态下的着色器程序
            slideDoor: null //移门热点下的着色器程序
        }
    };

    let userSetting = setting || {};
    this.toolSetting = {};
    for (let i in toolSetting) {
        this.toolSetting[i] = userSetting[i] || toolSetting[i];
    }

    this.init();
};

HotSpotManager.prototype = {
    init: function () {

        //todo:添加style样式
        /*var style = document.createElement("style");
         style.innerText = "" +
         ".defFocus{" +
         "   position:absolute;" +
         "   width:4px;" +
         "   height:4px;" +
         "   background:#30aee0;" +
         "   display:none;" +
         "   border-radius:2px;" +
         "}" +
         ".spinner{" +
         "   position:absolute;" +
         "   height:20px;" +
         "   width:20px;" +
         "   border:1px solid #30aee0;" +
         "   border-left-color:transparent;" +
         "   border-right-color:transparent;" +
         "   border-radius:50%;" +
         "   " + prefix() + "animation:spin 4s infinite;" +
         "}" +
         "@" + prefix() + "keyframes spin {" +
         "   0% {transform:rotate(0deg);}" +
         "   50% {transform:rotate(360deg);}" +
         "   100% {transform:rotate(0deg)}" +
         "}";*/
        this.createFocusCanvas();
        this.createPointerDom();

        //todo:创建移门热点的着色器
        this.initSliderShader();
    },
    //修改hotSpotArr数据
    changeHotSpotArr: function (obj) {
        let that = this;
        this.state.type = obj.type;

        //判断是否处于vr状态，普通状态只绘制移门热点，vr状态绘制所有热点和vr工具栏
        if (obj.type != "vr") {
            that.clearAll();
            //如果不处于vr状态下，只渲染
            that.hotSpotArr = obj.sceneHots;
            that.sceneArr = [];
            that.sceneMap = [];
            //添加到渲染列表
            addHot();
        }
        else {
            that.clearAll();
            //设置场景热点
            that.hotSpotArr = obj.sceneHots || [];
            that.sceneArr = obj.sceneArr || [];
            that.sceneMap = obj.sceneMap || [];

            //添加到渲染列表
            addHot();

            //添加工具栏，并创建渲染对象
            that.addToolBar();
        }

        function addHot() {
            //创建热点对象
            let arr = that.hotSpotArr;
            arr.forEach(function (hot) {
                let obj; //热点对象
                //let hot = arr[i]; //热点数据

                //如果是区域选择热点，则调用相应的方法生成对象 并直接返回
                if(hot.typeName && hot.typeName.type === 'area'){
                    createArea(hot);
                    return;
                }

                //生成移门热点
                if (hot.typeName.type === "slideDoor"){
                    createSlideDoorData(hot);
                    return;
                }

                //生成热点的标题对象，并添加到渲染列表
                if (hot.typeName.type !== "slideDoor_focus") createHotTitle(hot, 1);

                //如果当前热点为动态热点
                if (hot.typeName && hot.typeName.dynamic) {
                    //将默认图片和悬停图片都保存下来
                    hot.typeName.ImageNormal = new Image();
                    hot.typeName.ImageNormal.src = hot.Attributes.ImageNormal;

                    hot.typeName.ImageOver = new Image();
                    hot.typeName.ImageOver.src = hot.Attributes.ImageOver;

                    //生成当前热点所需要的canvas
                    let canvas = that._canvasDrawPic({
                        imgPath: hot.Attributes.ImageNormal,
                        stepBool: true,
                        canvasWidth: hot.Positions[0].Width,
                        canvasHeight: hot.Positions[0].Height,
                        step: hot.typeName.step
                    });

                    hot.Attributes = {};

                    //增加相关的回调函数
                    hot.typeName.callBack = {
                        vr_enter: function () {
                            canvas.changeImage(hot.typeName.ImageOver);
                        },
                        vr_leave: function () {
                            canvas.changeImage(hot.typeName.ImageNormal);
                        }
                    };

                    //将canvas对象添加给hot
                    hot.Canvas = {
                        CanvasNormal: canvas.getCanvas(),
                        CanvasOver: canvas.getCanvas()
                    };
                }

                //如果不显示图片，则将图片高宽设置为0
                if (hot.typeName && hot.typeName.noPic) {
                    hot.Positions[0].Width = 0;
                    hot.Positions[0].Height = 0;
                }

                //生成渲染对象
                obj = that.createHost(hot);
                obj.typeName = hot.typeName;
                obj.isShow = true;//是否显示

                //如果当前的热点对象是焦点热点，默认不显示
                if (hot.typeName.type === "slideDoor_focus") obj.isShow = false;
                obj.position = hot.Positions[0];

                that.hotSpotList[hot.HotspotID] = obj;
            });
        }

        //生成移门热点数据
        function createSlideDoorData(hot) {
            //是用户自己设置的移门热点，将宽度和高度设置成默认的500
            hot.Positions[0].Height = hot.Positions[0].Width = 1000;
            let typeName = hot.typeName;
            let position = hot.Positions[0];
            let data = hot.Actions[0].Params;

            let canvas = that._canvasDrawPic({
                imgPath: typeName.data[0] ? typeName.data[0].src : null,
                canvasWidth: position.Width,
                canvasHeight: position.Height,
                isFull: true
            });

            //循环将图片数组生成图片对象数组
            typeName.imgArr = [];
            for (let j = 0; j < typeName.data.length; j++) {
                let img = new Image();
                img.src = typeName.data[j].src;
                typeName.imgArr[j] = img;
            }

            typeName.canvas = data.canvas = canvas;
            typeName.index = data.index = 0;
            typeName.date = +new Date();
            hot.Attributes = {};
            hot.Canvas = {
                CanvasNormal: canvas.getCanvas(),
                CanvasOver: canvas.getCanvas()
            };
            //定时器
            typeName.interval = null;
            typeName.direction = "reduce"; //reduce 减少，索引变小， increase 增加，索引变大，默认

            //创建渲染热点对象
            let obj = that.createHost(hot);
            obj.typeName = hot.typeName;
            obj.isShow = true;//是否显示
            obj.position = hot.Positions[0];
            //移门热点添加到移门热点渲染数组，正常热点添加的默认列表
            that.hotSlideList[hot.HotspotID] = obj;
        }

        //生成热点标题
        function createHotTitle(hot, i) {
            //如果不是移门热点，将在热点下方添加提示文字
            let position = hot.Positions[0];
            let title = hot.Name;

            //获取缩略图的title配置
            let settings = that.toolSetting.thumbnail;

            //生成title对象
            let canvas = that.CreateTitle({
                canvas: document.createElement("canvas"), //显示的canvas
                width: 160, //显示的canvas宽度
                height: settings.thumbnailTitleLineHeight, //显示的canvas高度
                text: title, //显示的内容
                font: "normal 12px 'Microsoft YaHei'", //字体样式
                color: settings.thumbnailTitleColor, //字体颜色
                backgroundColor: "rgba(255,255,255,0.0)", //背景色
                textMoveStep: settings.thumbnailTitleMove, //文字移动的速度
                shadowColor: 'rgba(0,0,0,0.2)', // 字体阴影的颜色
                shadowOffsetX: 2, //字体阴影沿x轴的偏移量
                shadowOffsetY: 2, //字体阴影沿y轴的偏移量
                shadowBlur: 5, //字体阴影的模糊度
            });

            canvas.init();

            let titleObj = {
                /*"Actions": hot.Actions,*/
                "HotspotID": hot.HotspotID + "title", //切换上一组thumbnail
                "Name": "热点标题",
                "Type": "Image",
                "Attributes": {},
                Canvas: {
                    CanvasNormal: canvas.getCanvas(),
                    CanvasOver: canvas.getCanvas()
                },
                "Positions": [{
                    "Alpha": 1,
                    "Pan": position.Pan,
                    "Tilt": position.Tilt,
                    "Rx": 0,
                    "Ry": 0,
                    "Rz": 0,
                    "Tx": 0,
                    "Ty": 0,
                    "Sx": 1,
                    "Sy": 1,
                    "Width": position.Width || 160,
                    "Height": settings.thumbnailTitleLineHeight
                }],
                typeName: { //明确具体的功能位置
                    name: "thumbnail-list", //属于热点
                    type: "title", //对象的类型 标题
                    index: i, //下标
                    canvas: canvas //title对象
                }
            };

            //将热点标题添加到场景渲染数组当中
            let obj = that.createHost(titleObj);
            obj.typeName = titleObj.typeName;
            obj.isShow = true;//是否显示
            obj.position = titleObj.Positions[0];
            that.hotSpotList[titleObj.HotspotID] = obj;
        }

        //生成区域选择热点
        function createArea(hot){
            //生成渲染对象
            let obj = that.createArea(hot);
            obj.typeName = hot.typeName;
            obj.isShow = true;//是否显示

            obj.position = {
                Alpha:1
            };

            that.hotSpotList[hot.HotspotID] = obj;
        }
    },
    //vr焦点动画的制作
    loadingIcon: function (setting) {
        this.settings = {
            animationTime: 2,//动画执行时间
            divId: null,//div盒子的idClass
            divWidth: "20px",//盒子的宽度
            divHeight: "20px", // 盒子的高度
            divLoadClassName: "spinner", //添加class名字后就会执行加载动画
            divClass: "wrap-box",//两个盒子外面的盒子class
            leftWrapDivName: "leftWrap-box", //第一个盒子的class名字
            leftDivName: "left-box", //第一个盒子的class名字
            rightWrapDivName: "rightWrap-box", //内部第二个盒子的class名字
            rightDivName: "right-box", //内部第二个盒子的class名字
            infinite: true, // 是否循环
            loadingWidth: "1px", //圆圈宽度
            loadingColor: "#30aee0" //圆圈的颜色

        };

        this.timeOut = null; //延迟器

        if (setting) {
            for (var i in setting) {
                this.settings[i] = setting[i];
            }
        }


        this.prefix = function () {
            var div = document.createElement('div');
            var cssText = '-webkit-transition:all .1s; -moz-transition:all .1s; -o-transition:all .1s; -ms-transition:all .1s; transition:all .1s;';
            div.style.cssText = cssText;
            var style = div.style;
            if (style.webkitTransition) {
                return '-webkit-';
            }
            if (style.MozTransition) {
                return '-moz-';
            }
            if (style.oTransition) {
                return '-o-';
            }
            if (style.msTransition) {
                return '-ms-';
            }
            return '';
        };

        this.runOne = function (callback) {
            var that = this;
            //调用运行一次
            this.div.classList.add(this.settings.divLoadClassName);
            this.timeOut = setTimeout(function () {
                that.div.classList.remove(that.settings.divLoadClassName);
                callback.call(that.div, that.div);
            }, +that.settings.animationTime * 1000);
        };

        this.runForever = function () {
            this.div.classList.add(this.settings.divLoadClassName);
        };

        this.remove = function () {
            this.leftWrap.parentNode.removeChild(this.leftWrap);
            this.rightWrap.parentNode.removeChild(this.rightWrap);
            this.style.parentNode.removeChild(this.style);
        };

        if (typeof (this.settings.divId) == "object") {
            var div = this.div = this.settings.divId;
            this.settings.divId = this.div.id;
        }
        else {
            var div = this.div = document.getElementById(this.settings.divId);
        }

        div.style.cssText = "border-radius:50%; width:" + this.settings.divWidth + "; height:" + this.settings.divHeight + ";";
        if (!div.style.position) {
            div.style.position = "absolute";
        }
        var leftWrap = this.leftWrap = document.createElement("div");
        leftWrap.className = this.settings.divClass + " " + this.settings.leftWrapDivName;
        var rightWrap = this.rightWrap = document.createElement("div");
        rightWrap.className = this.settings.divClass + " " + this.settings.rightWrapDivName;
        var left = document.createElement("div");
        left.className = this.settings.leftDivName;
        var right = document.createElement("div");
        right.className = this.settings.rightDivName;
        var style = this.style = document.createElement("style");
        leftWrap.appendChild(left);
        rightWrap.appendChild(right);
        div.appendChild(leftWrap);
        div.appendChild(rightWrap);

        style.innerText = "" +
            "@" + this.prefix() + "keyframes left-animation {" +
            "   0%{transform: rotate(135deg);}" +
            "   50%{transform: rotate(135deg);}" +
            "   100%{transform: rotate(315deg);}" +
            "}\n" +
            "@" + this.prefix() + "keyframes right-animation {" +
            "   0%{transform: rotate(-45deg);}" +
            "   50%{transform: rotate(135deg);}" +
            "   100%{transform: rotate(135deg);}" +
            "}\n" +
            "#" + this.settings.divId + " ." + this.settings.divClass + "{" +
            "   position:absolute; top:0; width:" + div.offsetWidth / 2 + "px; height:" + div.offsetHeight + "px; overflow:hidden;" +
            "}\n" +
            "#" + this.settings.divId + " ." + this.settings.rightWrapDivName + "{" +
            "    right:0;" +
            "}\n" +
            "#" + this.settings.divId + " ." + this.settings.leftWrapDivName + "{" +
            "   left:0;" +
            "}\n" +
            "#" + this.settings.divId + ":after{" +
            "   content:''; display:block; height:4px; width:4px; position:absolute; top:50%; left:50%; margin-top:-2px; margin-left:-2px; background:" + this.settings.loadingColor + "; border-radius:50%; box-shadow: 0 0 2px #fff;" +
            "}\n" +
            "#" + this.settings.divId + " ." + this.settings.leftDivName + ",#" + this.settings.divId + " ." + this.settings.rightDivName + "{" +
            "   border-left:" + this.settings.loadingWidth + " solid " + this.settings.loadingColor + ";" +
            "   border-top:" + this.settings.loadingWidth + " solid " + this.settings.loadingColor + ";" +
            "   border-right:" + this.settings.loadingWidth + " solid transparent;" +
            "   border-bottom:" + this.settings.loadingWidth + " solid transparent;" +
            "   position:absolute;" +
            "   top:0;" +
            "   width:" + div.offsetWidth + "px;" +
            "   height:100%;" +
            "   border-radius:50%;" +
            "   box-sizing:border-box;" +
            "}\n" +
            "#" + this.settings.divId + " ." + this.settings.leftDivName + "{" +
            "   transform: rotate(135deg); left:0;" +
            "}\n" +
            "#" + this.settings.divId + " ." + this.settings.rightDivName + "{" +
            "   transform: rotate(-45deg); right:0;" +
            "}\n" +
            "#" + this.settings.divId + "." + this.settings.divLoadClassName + " ." + this.settings.leftDivName + "{" +
            "   " + this.prefix() + "animation: left-animation " + this.settings.animationTime + "s linear " + (this.settings.infinite ? "infinite" : "") +
            "}\n" +
            "#" + this.settings.divId + "." + this.settings.divLoadClassName + " ." + this.settings.rightDivName + "{" +
            "   " + this.prefix() + "animation: right-animation " + this.settings.animationTime + "s linear " + (this.settings.infinite ? "infinite" : "") +
            "}\n" +
            "";

        document.head.appendChild(style);
    },
    //计算当前工具栏所在的位置
    calculationTwoPointsDistance: function () {
        let that = this;
        let setting = this.toolSetting.tool;
        let ptf = that.playerObjCenterPTF;
        let step = setting.toolBarMoveMinStep;

        //通过现在的场景中心点计算出工具栏现在应该所在的位置
        let panDistance = Math.abs((ptf.pan - setting.toolBarMoveAfterPositionPan) / 20);
        let pan = panDistance > setting.toolBarMoveMinStepPan ? panDistance / 20 : setting.toolBarMoveMinStepPan;
        if (Math.abs(ptf.pan - setting.toolBarMoveAfterPositionPan) > 180) {
            if (ptf.pan < setting.toolBarMoveAfterPositionPan) {
                //两点的位置大于180°，并且窗口中心点小于工具栏中心点的pan
                panDistance = (ptf.pan + 360) - setting.toolBarMoveAfterPositionPan;
                pan = panDistance / step > setting.toolBarMoveMinStepPan ? panDistance / step : setting.toolBarMoveMinStepPan;
                setting.toolBarMoveAfterPositionPan = (pan + setting.toolBarMoveAfterPositionPan) % 360;
            }
            else {
                //两点的位置大于180°，并且窗口中心点大于工具栏的中心点的pan
                panDistance = (setting.toolBarMoveAfterPositionPan + 360) - ptf.pan;
                pan = panDistance / step > setting.toolBarMoveMinStepPan ? panDistance / step : setting.toolBarMoveMinStepPan;
                setting.toolBarMoveAfterPositionPan = setting.toolBarMoveAfterPositionPan - pan;
                if (setting.toolBarMoveAfterPositionPan <= 0) {
                    setting.toolBarMoveAfterPositionPan += 360;
                }
            }
        }
        else {
            if (ptf.pan < setting.toolBarMoveAfterPositionPan) {
                //两点的位置小于180°，并且窗口中心点小于工具栏中心点的pan
                panDistance = setting.toolBarMoveAfterPositionPan - ptf.pan;
                pan = panDistance / step > setting.toolBarMoveMinStepPan ? panDistance / step : setting.toolBarMoveMinStepPan;
                setting.toolBarMoveAfterPositionPan -= pan;
            }
            else {
                //两点的位置小于180°，并且窗口中心点大于工具栏的中心点的pan
                panDistance = ptf.pan - setting.toolBarMoveAfterPositionPan;
                pan = panDistance / step > setting.toolBarMoveMinStepPan ? panDistance / step : setting.toolBarMoveMinStepPan;
                setting.toolBarMoveAfterPositionPan += pan;
            }
        }

        let tiltDistance = Math.abs((setting.toolBarMoveTiltCenter * 2 - ptf.tilt - setting.toolBarMoveAfterPositionTilt) / 20);
        let tilt = tiltDistance > setting.toolBarMoveMinStepTilt ? tiltDistance / 20 : setting.toolBarMoveMinStepTilt;

        let windowCenterTilt = setting.toolBarMoveTiltCenter * 2 - ptf.tilt; //当前视口对应的工具栏的位置
        if (windowCenterTilt < setting.toolBarMoveAfterPositionTilt) {
            //视口中心点小于工具栏的中心点
            tiltDistance = setting.toolBarMoveAfterPositionTilt - windowCenterTilt;
            tilt = tiltDistance / step > setting.toolBarMoveMinStepTilt ? tiltDistance / step : setting.toolBarMoveMinStepTilt;
            setting.toolBarMoveAfterPositionTilt -= tilt;
        }
        else {
            //视口中心点大于工具栏中心点的tilt
            tiltDistance = windowCenterTilt - setting.toolBarMoveAfterPositionTilt;
            tilt = tiltDistance / step > setting.toolBarMoveMinStepTilt ? tiltDistance / step : setting.toolBarMoveMinStepTilt;
            setting.toolBarMoveAfterPositionTilt += tilt;
        }
        //console.log(pan, tilt);

        //当前工具栏所在的位置
        that.twoPointsDistance = {
            pan: setting.toolBarMoveAfterPositionPan,
            tilt: setting.toolBarMoveAfterPositionTilt
        };

        //console.log(/*that.twoPointsDistance.pan,that.playerObjCenterPTF.pan,that.twoPointsDistance.tilt,that.playerObjCenterPTF.tilt*/step,pan,tilt);

    },
    //获取当前视口的中心点的pan，tilt，fov
    getPTF: function (value) {
        var that = this;

        var pSize = this.playerObj.api_getPlayerSize();//获取播放窗口高宽

        //获取当前中心点的xy轴坐标
        var position = that.playerObjCenterPTF = that.playerObj.api_screenToSphere(pSize.width / 2, pSize.height / 2);
        return position;
    },
    //获取所有的webgl绘制的热点
    getAllDrawHot: function () {
        var obj = {};
        for (var i in this.hotSpotList) {
            obj[i] = this.hotSpotList[i];
        }
        for (var i in this.hotSlideList) {
            obj[i] = this.hotSlideList[i];
        }

        return obj;
    },
    //计算两个点pan，tilt之间的距离，b距离a的距离
    computeTwoDistance: function (a, b) {
        if (Math.abs(a.pan - b.pan) <= 180) {
            return {
                x: b.pan - a.pan,
                y: b.tilt - a.tilt
            }
        }
        else {
            if (a.pan >= b.pan) {
                return {
                    x: b.pan + 360 - a.pan,
                    y: b.tilt - a.tilt
                }
            }
            else {
                return {
                    x: b.pan - 360 - a.pan,
                    y: b.tilt - a.tilt
                }
            }
        }
    },
    //清空所有的相关数据方法
    clearObj: function () {
        var arr = [document.getElementById("leftPointDom"), document.getElementById("rightPointDom"), document.getElementById("centerPointDom"), this.foucusDom];
        for (var i = 0; i < arr.length; i++) {
            arr[i].parentNode.removeChild(arr[i]);
        }
        this.hotSpotOverArr = [];       //场景over 数组
        this.hotSpotList = {};
        this.hotSpotOverList = {};
        this.hotSpotDrawList = [];
    },
    //播放完毕后的场景热点数据模拟
    getOverHotSpotInfo: function (callback) {

        var ajson = {
            Actions: [{
                Name: (n.Code == "re_play") ? "action_replay" : "action_linkScene",
                Params: n.PageUrl,
                Triggers: {
                    Delay: 0,
                    Type: "mouse_click"
                }
            }],
            Attributes: {
                ImageNormal: n.PictureUrl, //"http://192.168.0.170/upload/list_utovr.png?" + new Date().getTime(),
                ImageOver: n.PictureUrl, // "http://192.168.0.170/upload/list_utovr.png?" + new Date().getTime()
                ColorOvr: (n.Code == "re_play") ? "0,0,0,200" : "200,200,200,200",
            },
            HotspotID: n.Code,
            Name: n.Name,
            Positions: [
                {
                    Alpha: 1,
                    Pan: panl * i,
                    Tilt: 0,
                    Rx: 0,
                    Ry: 0,
                    Rz: 0,
                    Sx: 1,
                    Sy: 1,
                    Time: "all",
                    Tx: 0,
                    Ty: 0,
                    Width: 200,
                    Height: 120

                }
            ],
            Type: "Image"
        };
    },
    //*创建焦点canvas
    createFocusCanvas: function () {
        this.foucusDom = document.createElement("canvas");
        this.foucusCTX = this.foucusDom.getContext("2d");
        //DomUtil.inject(this.foucusDom, document.body);
        this.setFocusDomSize();
    },
    //*创建中心点
    createPointerDom: function () {
        var playDom = this.playerObj.api_getPlayDom();
        var that = this;

        this.leftPointDom = document.createElement("div");
        this.leftPointDom.id = "leftPointDom";
        this.leftPointDom.classList.add("defFocus");
        playDom.appendChild(this.leftPointDom);
        new this.loadingIcon({divId: this.leftPointDom.id, animationTime: that.fireTime / 1000});

        this.rightPointDom = document.createElement("div");
        this.rightPointDom.id = "rightPointDom";
        this.rightPointDom.classList.add("defFocus");
        playDom.appendChild(this.rightPointDom);
        new this.loadingIcon({divId: this.rightPointDom.id, animationTime: that.fireTime / 1000});

        this.centerPointDom = document.createElement("div");
        this.centerPointDom.id = "centerPointDom";
        this.centerPointDom.classList.add("defFocus");
        playDom.appendChild(this.centerPointDom);
        new this.loadingIcon({divId: this.centerPointDom.id, animationTime: that.fireTime / 1000});

        this.setPointerSize();
    },
    //*设置中心点位置
    setPointerSize: function () {
        //判断是否处于vr状态
        var isGyroMode = this.playerObj.api_getVRMode();
        //非陀螺仪模式直接返回

        //console.log(!isGyroMode,this.hotSpotDrawList.length == 0);
        if (!isGyroMode || this.hotSpotDrawList.length == 0) {
            document.getElementById("centerPointDom").style.display = "none";
            document.getElementById("leftPointDom").style.display = "none";
            document.getElementById("rightPointDom").style.display = "none";
            return;
        }
        var pSize = this.playerObj.api_getPlayerSize();//获取播放窗口高宽
        var isDBViewPort = this.playerObj.api_getViewPortStatus();//获取单双屏状态
        var cusClass = this.leftPointDom.className;
        var arr = [this.leftPointDom, this.rightPointDom, this.centerPointDom];
        if (this.fireFocus) {
            if (cusClass == "defFocus") {
                for (var i = 0; i < arr.length; i++) {
                    arr[i].classList.remove("defFocus");
                    arr[i].classList.add("spinner");
                }
            }
        }
        else {
            if (cusClass == "spinner") {
                for (var i = 0; i < arr.length; i++) {
                    arr[i].classList.remove("spinner");
                    arr[i].classList.add("defFocus");
                }
            }
        }

        //根据高宽屏设置三个dom的left和top
        var leftSize, centerSize, rightSize;
        if (pSize.width > pSize.height) {
            //todo：横屏
            leftSize = {
                left: pSize.width / 4 - this.leftPointDom.offsetWidth / 2,
                top: pSize.height / 2 - this.leftPointDom.offsetHeight / 2
            };
            centerSize = {
                left: pSize.width / 2 - this.centerPointDom.offsetWidth / 2,
                top: pSize.height / 2 - this.centerPointDom.offsetHeight / 2
            };
            rightSize = {
                left: pSize.width / 4 * 3 - this.rightPointDom.offsetWidth / 2,
                top: pSize.height / 2 - this.rightPointDom.offsetHeight / 2
            };
        }
        else {
            //竖屏
            leftSize = {
                left: pSize.width / 2 - this.leftPointDom.offsetWidth / 2,
                top: pSize.height / 4 - this.leftPointDom.offsetHeight / 2
            };
            centerSize = {
                left: pSize.width / 2 - this.centerPointDom.offsetWidth / 2,
                top: pSize.height / 2 - this.centerPointDom.offsetHeight / 2
            };
            rightSize = {
                left: pSize.width / 2 - this.rightPointDom.offsetWidth / 2,
                top: pSize.height / 4 * 3 - this.rightPointDom.offsetHeight / 2
            };
        }

        if (isDBViewPort) {
            //todo：双屏状态
            if (pSize.width > pSize.height) {
                //todo:横屏
                this.mouseX = pSize.width / 4;
                this.mouseY = pSize.height / 2;

            }
            else {

                //todo:竖屏
                this.mouseX = pSize.width / 2;
                this.mouseY = pSize.height / 4;

            }
            document.getElementById("centerPointDom").style.display = "none";
            document.getElementById("leftPointDom").style.display = "block";
            document.getElementById("rightPointDom").style.display = "block";

            this.leftPointDom.style.left = leftSize.left + "px";
            this.leftPointDom.style.top = leftSize.top + "px";

            this.rightPointDom.style.left = rightSize.left + "px";
            this.rightPointDom.style.top = rightSize.top + "px";
        }
        else {
            //todo：单屏状态
            document.getElementById("centerPointDom").style.display = "block";
            document.getElementById("leftPointDom").style.display = "none";
            document.getElementById("rightPointDom").style.display = "none";

            this.mouseX = pSize.width / 4 * 2;
            this.mouseY = pSize.height / 2;
            this.centerPointDom.style.left = centerSize.left + "px";
            this.centerPointDom.style.top = centerSize.top + "px";
        }
    },
    //*设置焦点canvas的尺寸
    setFocusDomSize: function () {
        var sizeInfo = this.playerObj.api_getPlayerSize();
        this.foucusDom.width = this.playerObj.api_getViewPortStatus() ? sizeInfo.width * 0.5 : sizeInfo.width;
        this.foucusDom.height = sizeInfo.height;
        DomUtil.setStyles(this.foucusDom, {
            position: "absolute",
            width: this.foucusDom.width + "px",
            height: this.foucusDom.height + "px",
            pointerEvents: "none"
        });
    },
    //*判断当前焦点是否处于当前绘制的canvas内
    isFocusInPath: function (arr, focusX, focusY) {
        if (arr.length === 0) return false;
        //开始一个新的绘制路径
        this.foucusCTX.beginPath();
        //设置线条颜色为蓝色
        this.foucusCTX.strokeStyle = "#1caffc";
        //设置路径起点坐标
        this.foucusCTX.moveTo(arr[0].x, arr[0].y);
        //绘制直线线段到坐标点(60, 50)
        for (var i = 1; i < arr.length; i++) {
            this.foucusCTX.lineTo(arr[i].x, arr[i].y);
        }
        //先关闭绘制路径。注意，此时将会使用直线连接当前端点和起始端点。
        this.foucusCTX.closePath();
        //最后，按照绘制路径画出直线
        this.foucusCTX.stroke();
        //todo:返回中心焦点是否在绘制的多边形中
        return this.foucusCTX.isPointInPath(focusX || 0, focusY || 0);
    },
    //鼠标捕获检测
    rayCastFN: function (focusX, focusY, obj) {
        var ps = [];
        for (var i = 0; i < obj.modeJSON.vertexBuffer.numItems; i++) {
            var p = obj.modeJSON.vertexData.slice(i * obj.modeJSON.vertexBuffer.itemSize, i * obj.modeJSON.vertexBuffer.itemSize + 3);
            var x = p[0], y = p[1], z = p[2];
            var xy = this.playerObj.api_3DXYZToScreen(x, y, z);
            ps.push(xy);
        }
        return this.isFocusInPath(ps, focusX, focusY);
    },
    //生成旋转矩阵
    createFlatMatrix: function (config) {
        //console.log(config);
        var psize = this.playerObj.api_getWebGLInfo();
        var viewW = psize.viewWidth, viewH = psize.viewHeight;
        //console.log(mat4);
        //todo:处理旋转
        var rp = config.Pan, rt = config.Tilt;
        var fixPan = 90;
        var rY = rp + fixPan;
        var rX = rt;
        var mMatrix = mat4['create'](); //单位矩阵

        //todo:这里一定要先旋转 pan  也就是 y轴先转
        mat4['rotateY'](mMatrix, mMatrix, -(rY * Math.PI / 180));
        mat4['rotateX'](mMatrix, mMatrix, (rX * Math.PI / 180));

        //todo:处理平移
        var mxp = config.Tx, myp = config.Ty, mzp = config.Tz || -1.0;
        mat4['translate'](mMatrix, mMatrix, [mxp, myp, mzp]);

        //todo：处理自身的旋转
        var rx = config.Rx || 0, ry = config.Ry || 0, rz = config.Rz || 0;
        mat4['rotateY'](mMatrix, mMatrix, (ry * Math.PI / 180));
        mat4['rotateX'](mMatrix, mMatrix, (rx * Math.PI / 180));
        mat4['rotateZ'](mMatrix, mMatrix, (rz * Math.PI / 180));

        //todo:处理缩放
        var sx = config.Sx * ((config.Width) / 1000);  //x方向缩放到设定的尺寸
        var sy = config.Sy * ((config.Height) / 1000);//y方向缩放到设定的尺寸
        var sz = 1;// config.Sz || 0;// (config.Height * 1) / viewW * 0.5;//y方向缩放到设定的尺寸
        mat4.scale(mMatrix, mMatrix, [sx, sy, +sz]);
        return mMatrix;
    },
    //原版的生成 纹理位置顶点位置和索引
    createFlatBuffer: function (mMatrix) {
        var p1 = vec3.copy([], [-1, -1, 0]),
            p2 = vec3.copy([], [1, -1, 0]),
            p4 = vec3.copy([], [-1, 1, 0]),
            p3 = vec3.copy([], [1, 1, 0]);
        //调整尺寸
        vec3.transformMat4(p1, p1, mMatrix);
        vec3.transformMat4(p2, p2, mMatrix);
        vec3.transformMat4(p3, p3, mMatrix);
        vec3.transformMat4(p4, p4, mMatrix);

        return {
            vertexData: p1.concat(p2).concat(p3).concat(p4),
            textureData: [
                0.0, 1.0, //v0
                1.0, 1.0, //v1
                1.0, 0.0, //v3
                0.0, 0.0//v2
            ],
            indexData: [0, 1, 2, 0, 2, 3]
        }
    },
    //移门热点所需要的生成纹理的位置、顶点的位置和索引
    createSlideDoorFlatBuffer: function (mMatrix, arr) {
        var p1 = vec3.copy([], [arr[0], arr[1], 0]),
            p2 = vec3.copy([], [arr[2], arr[3], 0]),
            p4 = vec3.copy([], [arr[4], arr[5], 0]),
            p3 = vec3.copy([], [arr[6], arr[7], 0]);
        //调整尺寸
        vec3.transformMat4(p1, p1, mMatrix);
        vec3.transformMat4(p2, p2, mMatrix);
        vec3.transformMat4(p3, p3, mMatrix);
        vec3.transformMat4(p4, p4, mMatrix);

        //需要四个顶点的坐标和下标索引
        return {
            vertexData: p1.concat(p2).concat(p3).concat(p4),
            textureData: [
                arr[0], arr[1], //v0
                arr[2], arr[3], //v1
                arr[6], arr[7], //v3
                arr[4], arr[5]//v2
            ],
            indexData: [0, 1, 2, 0, 2, 3]
        }
    },
    //绑定纹理 顶点和索引的方法
    webGLBindBuffer: function (data) {
        var modeJSON = {};
        var webGLInfo = this.playerObj.api_getWebGLInfo();
        var gl = webGLInfo.webGL;
        modeJSON.vertexData = data.vertexData;
        modeJSON.textureData = data.textureData;
        modeJSON.indexData = data.indexData;
        modeJSON.texture = gl.createTexture();
        modeJSON.textureBuffer = gl.createBuffer();
        modeJSON.vertexBuffer = gl.createBuffer();
        modeJSON.indexBuffer = gl.createBuffer();
        //纹理位置buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, modeJSON.textureBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(modeJSON.textureData), gl.STATIC_DRAW);
        modeJSON.textureBuffer.itemSize = 2;
        modeJSON.textureBuffer.numItems = modeJSON.textureData.length / 2;
        //顶点坐标
        gl.bindBuffer(gl.ARRAY_BUFFER, modeJSON.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(modeJSON.vertexData), gl.STATIC_DRAW);
        modeJSON.vertexBuffer.itemSize = 3;
        modeJSON.vertexBuffer.numItems = modeJSON.vertexData.length / 3;
        //顶点索引buffer
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, modeJSON.indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(modeJSON.indexData), gl.STATIC_DRAW);
        modeJSON.indexBuffer.itemSize = 1;
        modeJSON.indexBuffer.numItems = modeJSON.indexData.length;
        return modeJSON;
    },
    //重新绑定纹理 个人新增
    webGLUpdateBuffer: function (flatObj, slideDoor) {
        var that = this;
        var webGLInfo = this.playerObj.api_getWebGLInfo();
        var gl = webGLInfo.webGL;
        var newMatrixObj; //重新生成
        if (slideDoor) {
            //如果是移门热点下，重新生成热点数据
            flatObj.mMatrix = this.createFlatMatrix(flatObj.position);
            //获取到相关矩阵，然后通过矩阵和位置数组生成在场景中的四个顶点的xyz的位置
            newMatrixObj = this.createSlideDoorFlatBuffer(flatObj.mMatrix, flatObj.position.Config);
        }
        else {
            //重新生成矩阵
            newMatrixObj = that.createFlatBuffer(that.createFlatMatrix(flatObj.position));
        }
        //重新生成纹理
        var modeJSON = flatObj.modeJSON;
        modeJSON.vertexData = newMatrixObj.vertexData;
        modeJSON.textureData = newMatrixObj.textureData;
        modeJSON.indexData = newMatrixObj.indexData;
        //纹理位置buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, modeJSON.textureBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(modeJSON.textureData), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, modeJSON.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(modeJSON.vertexData), gl.STATIC_DRAW);
        //顶点索引buffer
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, modeJSON.indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(modeJSON.indexData), gl.STATIC_DRAW);
    },
    //创建移门热点的着色器shader
    initSliderShader: function () {
        let that = this;
        let webGLInfo = this.playerObj.api_getWebGLInfo();
        let gl = webGLInfo.webGL;
        let settings = this.toolSetting.shader;
        let dop = that.dop;
        //顶点着色器代码
        let vertexShaderSource = "" +
            "attribute vec4 a_Position;\n" +
            "attribute vec2 a_texture;\n" +//
            "varying vec2 v_Position;\n" +
            "uniform mat4 uMMatrix;\n" +
            "uniform mat4 uPMatrix;\n" +
            "void main(){\n" +
            "   gl_Position = uPMatrix * uMMatrix * a_Position;\n" +
            "   v_Position = a_texture;\n" +
            "}\n";

        //片元着色器
        let fragmentShaderSource = "";//精度设置 highp mediump
        if (dop.browserRedirect() === "pc") {
            fragmentShaderSource += "precision mediump float;\n";
        }
        else {
            fragmentShaderSource += "precision highp float;\n";
        }
        fragmentShaderSource += "" +//
            "uniform sampler2D u_Sampler;\n" +//
            "varying vec2 v_Position;\n" +
            "uniform vec2 u_point0;\n" +
            "uniform vec2 u_point1;\n" +
            "uniform vec2 u_point2;\n" +
            "uniform vec2 u_point3;\n" +
            "float calc(vec2 p1,vec2 p2,vec2 p3,vec2 p4,vec2 p0){\n" +
            //如果不是平行的两条直线
            "   float p12Xlen = p2.x-p1.x;\n" +
            "   float p12Ylen = p2.y-p1.y;\n" +
            "   float p34Xlen = p4.x-p3.x;\n" +
            "   float p34Ylen = p4.y-p3.y;\n" +
            "   float a = p12Xlen*p34Ylen-p12Ylen*p34Xlen;\n" +
            "   float b = p1.x*p34Ylen+p3.y*p12Xlen-p0.y*p12Xlen-p3.x*p12Ylen+p0.y*p34Xlen-p1.y*p34Xlen+p0.x*(p12Ylen-p34Ylen);\n" +
            "   float c = p3.x*p0.y-p3.x*p1.y+p1.x*p3.y-p1.x*p0.y+p0.x*(p1.y-p3.y);\n" +
            //两条线都垂直于x轴或者y轴的情况下
            "   if(a == 0.0){\n" +
            "       return -c/b;\n" +
            "   }\n" +
            //两条线不平行的情况下
            "   float endA = (-b+sqrt(b*b-4.0*a*c))/(2.0*a);\n" +
            "   float endB = (-b-sqrt(b*b-4.0*a*c))/(2.0*a);\n" +
            "   if(endA > 0.0 && endA < 1.0){\n" +
            "       return endA;\n" +
            "   }\n" +
            "   if(endB > 0.0 && endB < 1.0){\n" +
            "       return endB;\n" +
            "   }\n" +
            "   else {\n" +
            "       return -c/b;\n" +
            "   }\n" +
            "}\n" +
            "" +
            //两个点的位置，第一个calc（v0,v2,v1,v3,p0） 第二个calc(v1,v0,v3,v2,p0)
            "void main(){\n" +
            "   gl_FragColor = texture2D(u_Sampler,vec2(calc(u_point0,u_point1,u_point2,u_point3,v_Position),1.0-calc(u_point0,u_point2,u_point1,u_point3,v_Position)));\n" +//
            "}\n";

        settings.slideDoor = createProgram(gl, vertexShaderSource, fragmentShaderSource);

        //-------------------------------------------------------正常的模式下的着色器-------------------------------------------------------------
        var vShaderSource = "" +
            "attribute vec3 aVertex; \n" +
            "attribute vec2 aTexture; \n" +
            "uniform mat4 uMMatrix; \n" +
            "uniform mat4 uPMatrix; \n" +
            "varying vec2 vTexture; \n" +
            "void main(){\n" +
            "   gl_Position = uPMatrix * uMMatrix * vec4(aVertex,1.0);\n" +
            "   vTexture = aTexture;\n" +
            "}\n";

        var fShaderSource = "" +
            "#ifdef GL_ES\n" +
            "#ifdef GL_FRAGMENT_PRECISION_HIGH\n" +
            "precision highp float;\n" +
            "#else\n" +
            "precision mediump float;\n" +
            "#endif\n" +
            "#endif\n" +
            "uniform float fAlpha;\n" +
            "uniform float aTextureScaleX;\n" +
            "uniform float aTextureScaleY;\n" +
            "uniform float aTextureOffsetX;\n" +
            "uniform float aTextureOffsetY;\n" +
            "uniform sampler2D uSampler;\n" +
            "varying vec2 vTexture;" +
            "void main(){\n" +
            "   vec2 tScale = vec2(aTextureScaleX,aTextureScaleY);\n" +
            "   vec2 tOffset = vec2(aTextureOffsetX,aTextureOffsetY);\n" +
            "   vec2 cTexture = (vTexture.xy * tScale.xy) + tOffset.xy;\n" +
            "   vec4 c = texture2D(uSampler,vec2(cTexture.s,cTexture.t),-1.0);\n" +
            "   gl_FragColor = vec4(c.rgb,c.a * fAlpha);\n" +
            "}\n";

        settings.normal = createProgram(gl, vShaderSource, fShaderSource);

        function createProgram(gl, vshader, fshader) {
            // Create shader object
            var vertexShader = loadShader(gl, gl.VERTEX_SHADER, vshader);
            var fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fshader);
            if (!vertexShader || !fragmentShader) {
                return null;
            }

            // Create a program object
            var program = gl.createProgram();
            if (!program) {
                return null;
            }

            // Attach the shader objects
            gl.attachShader(program, vertexShader);
            gl.attachShader(program, fragmentShader);

            // Link the program object
            gl.linkProgram(program);

            // Check the result of linking
            var linked = gl.getProgramParameter(program, gl.LINK_STATUS);
            if (!linked) {
                var error = gl.getProgramInfoLog(program);
                console.log('Failed to link program: ' + error);
                gl.deleteProgram(program);
                gl.deleteShader(fragmentShader);
                gl.deleteShader(vertexShader);
                return null;
            }
            return program;
        }

        function loadShader(gl, type, source) {
            // Create shader object
            var shader = gl.createShader(type);
            if (shader == null) {
                console.log('unable to create shader');
                return null;
            }

            // Set the shader program
            gl.shaderSource(shader, source);

            // Compile the shader
            gl.compileShader(shader);

            // Check the result of compilation
            var compiled = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
            if (!compiled) {
                var error = gl.getShaderInfoLog(shader);
                console.log('Failed to compile shader: ' + error);
                gl.deleteShader(shader);
                return null;
            }

            return shader;
        }

    },
    //纹理选择检测
    getDrawTexture: function () {
        return this.isFocus ? (this.imageSelObj || this.canvasSelObj) : (this.imageNorObj || this.canvasNorObj);
    },
    //加载图片纹理
    loadImageTexture: function (path, successCallBack, errorCallBack) {
        if (!path) return;
        var img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = function () {
            successCallBack && successCallBack(this);
        };
        img.onerror = function () {
            errorCallBack && errorCallBack(this);
        };
        img.src = path;//.replace("http://yx.intranet.com/vrtour/images/", "http://192.168.0.170:80/upload/");//文件路径
        return img;
    },
    //*设置canvas的绘制对象的相关属性
    setCanvasCTX: function (ctx, options) {
        for (var key in options) {
            ctx[key] = options[key];
        }
    },
    //加载canvas纹理
    loadCanvasTexture: function (HSConfig) {
        let canvas = document.createElement("canvas");
        canvas.width = HSConfig.Positions[0].Width || 10;
        canvas.height = HSConfig.Positions[0].Height || 10;
        let colorArr = HSConfig.Attributes.ColorOvr ? HSConfig.Attributes.ColorOvr.split(",") : "";
        colorArr = colorArr ? colorArr : [0, 0, 0, 150];
        let opacity = (colorArr[3] / 255).toFixed(2);
        let hex = JTUtil.rgbToHex(colorArr[0] * 1, colorArr[1] * 1, colorArr[2] * 1);

        let ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = hex || JTUtil.rndRGB();//"#000000";
        ctx.globalAlpha = opacity;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        return canvas;
    },
    //*创建热点对象
    createHost: function (config) {
        //console.log(config);
        let HSObj = {};
        //根据配置生成旋转矩阵
        HSObj.actions = config.Actions || null;
        HSObj.type = config.Type;
        HSObj.name = config.Name;
        HSObj.HotspotID = config.HotspotID;
        //判断是否是移门热点，如果是移门热点，直接赋值，如果不是，就按原来的规则设置
        let buffer;
        if (config.Positions[0].SlideDoor) {
            //然后读取四个点的数组的位置信息，通过信息生成buffer数据
            /*
            *   v2-------------v3
            *   |               |
            *   |               |
            *   |               |
            *   |               |
            *   |               |
            *   v0-------------v1
            *
            *   [v0.x,v0.y,v1.x,v1.y,v2.x,v2.y,v3.x,v3.y]
            *   config.Positions[0].Config 数组由八个数据组成，代表四个点的位置，距离中心点的偏移量
            * */
            HSObj.mMatrix = this.createFlatMatrix(config.Positions[0]);
            //获取到相关矩阵，然后通过矩阵和位置数组生成在场景中的四个顶点的xyz的位置
            buffer = this.createSlideDoorFlatBuffer(HSObj.mMatrix, config.Positions[0].Config);
            //console.log(buffer);
        }
        else {
            HSObj.mMatrix = this.createFlatMatrix(config.Positions[0]);
            buffer = this.createFlatBuffer(HSObj.mMatrix);
        }
        //console.log(buffer);
        HSObj.modeJSON = this.webGLBindBuffer(buffer);

        //是否被焦点捕获
        HSObj.isFocus = false;    //热点是否被捕获
        HSObj.isShow = false;  //热点是否显示
        HSObj.imageNorObj = null;
        HSObj.imageSelObj = null;

        //创建默认的canvas纹理
        if (config.Canvas) {
            HSObj.canvasNorObj = config.Canvas.CanvasNormal;
            HSObj.canvasSelObj = config.Canvas.CanvasOver;
        }
        else {
            HSObj.canvasNorObj = this.loadCanvasTexture(config);
            HSObj.canvasSelObj = this.loadCanvasTexture(config);
        }
        //todo:加载热点的纹理信息
        this.loadImageTexture(config.Attributes.ImageNormal, function (e) {
            this.imageNorObj = e;
        }.bind(HSObj));
        this.loadImageTexture(config.Attributes.ImageOver, function (e) {
            this.imageSelObj = e;
        }.bind(HSObj));
        //todo:添加被捕获函数
        HSObj.checkRayCast = this.rayCastFN.bind(this);
        //todo:获取需要绘制的纹理
        HSObj.getDrawTexture = this.getDrawTexture;
        //todo:格式化纹理
        this.playerObj.api_formatTexture(HSObj.modeJSON.texture, HSObj.getDrawTexture());

        return HSObj;
    },
    //创建生成区域选择热点对象
    createArea: function (config){
        //console.log(config);
        let HSObj = {};
        //根据配置生成旋转矩阵
        HSObj.actions = config.Actions || null;
        HSObj.type = config.Type;
        HSObj.name = config.Name;
        HSObj.HotspotID = config.HotspotID;
        //判断是否是移门热点，如果是移门热点，直接赋值，如果不是，就按原来的规则设置
        let buffer = this.createAreaBuffer(config);
        HSObj.modeJSON = this.webGLBindBuffer(buffer);

        //是否被焦点捕获
        HSObj.isFocus = false;    //热点是否被捕获
        HSObj.isShow = false;  //热点是否显示

        //创建默认的canvas纹理HSConfig.Attributes.ColorOvr
        HSObj.imageNorObj = this.loadCanvasTexture({Attributes:{ColorOvr:'0, 0, 0, 150'}, Positions:[{}]});
        HSObj.imageSelObj = this.loadCanvasTexture({Attributes:{ColorOvr:'60, 60, 60, 150'}, Positions:[{}]});

        //todo:添加被捕获函数
        HSObj.checkRayCast = this.rayCastFN.bind(this);
        //todo:获取需要绘制的纹理
        HSObj.getDrawTexture = function () {
            return this.isFocus ? this.imageSelObj : this.imageNorObj;
        };

        //todo:格式化纹理
        this.playerObj.api_formatTexture(HSObj.modeJSON.texture, HSObj.getDrawTexture());

        return HSObj;
    },
    //生成区域选择所需的buffer
    createAreaBuffer:function(config){
        const position = config.drawArray;
        const vertexData = []; //顶点位置
        let textureData;

        if(position && position.length/3 >= 3){
            //生成顶点和uv数据
            for(let i=0; i<position.length; i+=3){
                const worldPos = this.panTiltToWorld(position[i], position[i+1]);
                vertexData.push(...worldPos);
            }

            //生成uv
            textureData = config.uv.map(function (item) {
                return .5;
            });

            return {
                vertexData: vertexData,
                textureData: textureData,
                indexData: config.index
            }
        }
        else{
            return {
                vertexData: [],
                textureData: [],
                indexData: []
            }
        }
    },
    //绘制前绑定相关数据
    api_bindBuffer: function (modeObj) {
        var webGLInfo = this.playerObj.api_getWebGLInfo();
        var gl = webGLInfo.webGL;
        //todo:绑定顶点数据
        gl.bindBuffer(gl.ARRAY_BUFFER, modeObj.vertexBuffer);
        gl.vertexAttribPointer(webGLInfo.vertex, modeObj.vertexBuffer.itemSize, gl.FLOAT, true, 0, 0);
        //todo:绑定纹理数据
        gl.bindBuffer(gl.ARRAY_BUFFER, modeObj.textureBuffer);
        gl.vertexAttribPointer(webGLInfo.texture, modeObj.textureBuffer.itemSize, gl.FLOAT, true, 0, 0);
        //todo:绑定纹理
        gl.bindTexture(gl.TEXTURE_2D, modeObj.texture);
        //todo:绑定索引数据
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, modeObj.indexBuffer);
    },
    //*-----------------------------------------------------每次重新刷新绘制--------------------------------------------------------

    //*绘制平面热点
    drawFlat: function (flatObj) {
        //如果是移门热点，直接调用移门热点的方法
        let that = this;
        let pObj = this.playerObj;
        let webGLInfo = this.playerObj.api_getWebGLInfo();
        let gl = webGLInfo.webGL;
        //todo:切换着色器为默认着色器程序

        //var shader = this.toolSetting.shader.normal;
        //gl.useProgram(shader);

        let indexNum = flatObj.modeJSON.indexBuffer.numItems;
        let vw = webGLInfo.viewWidth, vh = webGLInfo.viewHeight;
        //todo:检测热点是否获得焦点
        flatObj.checkRayCast(this.mouseX, this.mouseY, flatObj) ? flatObj.isFocus = true : flatObj.isFocus = false;
        //todo:格式化纹理
        pObj.api_formatTexture(flatObj.modeJSON.texture, flatObj.getDrawTexture());

        //*-----------------------------个人新增，更新矩阵---------------------------------------------------------
        this.drawBeforeUpdateTool(flatObj); //绘制前更新工具栏矩阵

        //bindBuffer，并填充数据
        this.api_bindBuffer(flatObj.modeJSON);
        if (!pObj.api_getViewPortStatus()) {
            //todo:单屏状态下绘制
            pObj.api_uploadMatrixUniforms();
            //todo：纹理GLES属性的默认值 默认不缩放
            pObj.api_setTextureSize(1.0, 0.0, 1.0, 0.0);
            //设置透明度
            pObj.api_uploadMatrixUniforms(null, null, flatObj.position.Alpha);
            gl.viewport(0, 0, vw, vh);
            gl.drawElements(gl.TRIANGLES, indexNum, gl.UNSIGNED_SHORT, 0);
        }
        else {
            //todo：双屏状态下绘制
            if (vw > vh) {
                // var pm = [];
                //左眼
                //mat4['translate'](pm, pObj.pMatrix, [pObj.DBViewIPD, 0.0, 0.0]);             //球形图小行星设置
                //更新mvp矩阵
                pObj.api_uploadMatrixUniforms(/*null, pm*/null, null, flatObj.position.Alpha);
                gl.viewport(0, 0, vw * 0.5, vh);
                gl.drawElements(gl.TRIANGLES, indexNum, gl.UNSIGNED_SHORT, 0);
                //右眼
                //  mat4['translate'](pm, pObj.pMatrix, [-pObj.DBViewIPD * 2, 0.0, 0.0]);             //球形图小行星设置
                //更新mvp矩阵
                pObj.api_uploadMatrixUniforms(/*null, pm*/null, null, flatObj.position.Alpha);
                gl.viewport(vw * 0.5, 0, vw * 0.5, vh);
                gl.drawElements(gl.TRIANGLES, indexNum, gl.UNSIGNED_SHORT, 0);
                pObj.api_uploadMatrixUniforms();
            }
            else {
                // var pm = [];
                //左眼
                //mat4['translate'](pm, pObj.pMatrix, [pObj.DBViewIPD, 0.0, 0.0]);             //球形图小行星设置
                //更新mvp矩阵
                pObj.api_uploadMatrixUniforms(/*null, pm*/null, null, flatObj.position.Alpha);
                gl.viewport(0, 0, vw, vh * 0.5);
                gl.drawElements(gl.TRIANGLES, indexNum, gl.UNSIGNED_SHORT, 0);
                //右眼
                //  mat4['translate'](pm, pObj.pMatrix, [-pObj.DBViewIPD * 2, 0.0, 0.0]);             //球形图小行星设置
                //更新mvp矩阵
                pObj.api_uploadMatrixUniforms(/*null, pm*/null, null, flatObj.position.Alpha);
                gl.viewport(0, vh * 0.5, vw, vh * 0.5);
                gl.drawElements(gl.TRIANGLES, indexNum, gl.UNSIGNED_SHORT, 0);
                pObj.api_uploadMatrixUniforms();
            }
        }
        //todo:添加到已经绘制的数组
        this.hotSpotDrawList.push(flatObj);
    },
    //绘制移门热点
    drawSlideDoor: function (flatObj) {
        let that = this;
        let pObj = this.playerObj;
        let webGLInfo = this.playerObj.api_getWebGLInfo();
        let gl = webGLInfo.webGL;
        let indexNum = flatObj.modeJSON.indexBuffer.numItems;
        let vw = webGLInfo.viewWidth, vh = webGLInfo.viewHeight;
        let settings = this.toolSetting.slideDoor;
        let shader = this.toolSetting.shader.slideDoor;
        //todo:切换系统使用的程序对象
        gl.useProgram(shader);

        //todo:首先判断是否是在添加热点页面，如果是需要实时更新位置
        if (flatObj.typeName.canMove) {
            //todo:第二个值传入true代表为移门热点更新位置
            that.webGLUpdateBuffer(flatObj, true);
        }
        //todo:获取两个矩阵
        let uMMatrix = gl.getUniformLocation(shader, "uMMatrix");
        let uPMatrix = gl.getUniformLocation(shader, "uPMatrix");
        let matrix = pObj.api_getCurMPMatrix();
        gl.uniformMatrix4fv(uMMatrix, false, matrix.mm);
        gl.uniformMatrix4fv(uPMatrix, false, matrix.pm);
        //todo:将顶点传入
        let config = flatObj.position.Config;
        let point0 = gl.getUniformLocation(shader, "u_point0");
        let point1 = gl.getUniformLocation(shader, "u_point1");
        let point2 = gl.getUniformLocation(shader, "u_point2");
        let point3 = gl.getUniformLocation(shader, "u_point3");
        gl.uniform2f(point0, config[0], config[1]);
        gl.uniform2f(point1, config[2], config[3]);
        gl.uniform2f(point2, config[4], config[5]);
        gl.uniform2f(point3, config[6], config[7]);

        //todo:检测热点是否获得焦点
        flatObj.checkRayCast(this.mouseX, this.mouseY, flatObj) ? flatObj.isFocus = true : flatObj.isFocus = false;

        //todo:格式化纹理
        pObj.api_formatTexture(flatObj.modeJSON.texture, flatObj.getDrawTexture());
        //*-----------------------------个人新增，更新矩阵---------------------------------------------------------
        this.drawBeforeUpdateTool(flatObj); //绘制前更新工具栏矩阵

        //todo:bindBuffer，并填充数据
        this.api_bindBuffer(flatObj.modeJSON);
        if (!pObj.api_getViewPortStatus()) {
            //todo:单屏状态下绘制
            //pObj.api_uploadMatrixUniforms();
            //todo：纹理GLES属性的默认值 默认不缩放
            //pObj.api_setTextureSize(1.0, 0.0, 1.0, 0.0);
            //设置透明度
            //pObj.api_uploadMatrixUniforms(null, null, flatObj.position.Alpha);
            gl.viewport(0, 0, vw, vh);
            gl.drawElements(gl.TRIANGLES, indexNum, gl.UNSIGNED_SHORT, 0);
        }
        else {
            //todo：双屏状态下绘制
            if (vw > vh) {
                //左眼
                //pObj.api_uploadMatrixUniforms(null, null, flatObj.position.Alpha);
                gl.viewport(0, 0, vw * 0.5, vh);
                gl.drawElements(gl.TRIANGLES, indexNum, gl.UNSIGNED_SHORT, 0);
                //右眼
                //pObj.api_uploadMatrixUniforms(null, null, flatObj.position.Alpha);
                gl.viewport(vw * 0.5, 0, vw * 0.5, vh);
                gl.drawElements(gl.TRIANGLES, indexNum, gl.UNSIGNED_SHORT, 0);
                //pObj.api_uploadMatrixUniforms();
            }
            else {
                //左眼
                //pObj.api_uploadMatrixUniforms(null, null, flatObj.position.Alpha);
                gl.viewport(0, 0, vw, vh * 0.5);
                gl.drawElements(gl.TRIANGLES, indexNum, gl.UNSIGNED_SHORT, 0);
                //右眼
                //pObj.api_uploadMatrixUniforms(null, null, flatObj.position.Alpha);
                gl.viewport(0, vh * 0.5, vw, vh * 0.5);
                gl.drawElements(gl.TRIANGLES, indexNum, gl.UNSIGNED_SHORT, 0);
                //pObj.api_uploadMatrixUniforms();
            }
        }
        //todo:添加到已经绘制的数组
        this.hotSpotDrawList.push(flatObj);
    },
    //绘制之前的一些判断,事件处理
    drawBeforeUpdateTool: function (flatObj) {
        let that = this;
        let setting = this.toolSetting.tool;
        let slideDoor = this.toolSetting.slideDoor;
        let hotList = this.getAllDrawHot();

        //计算工具栏的位置
        if (flatObj.changePosition && !that.getToolBar()) {
            //先获取场景的中心点
            that.getPTF();
            //计算这一帧移动的距离
            that.calculationTwoPointsDistance();
            //重新配置值的位置
            flatObj.position.Pan = that.twoPointsDistance.pan;
            flatObj.position.Tilt = that.twoPointsDistance.tilt;
            if (Math.abs(flatObj.position.Tilt - setting.toolBarMoveTiltCenter) > setting.toolBarMoveTiltRange) {
                return false;
            }
            else {
                //计算出工具栏的透明度
                flatObj.position.Alpha = 1 - Math.abs(flatObj.position.Tilt - setting.toolBarMoveTiltCenter) / setting.toolBarMoveTiltRange;
            }

            //重新生成矩阵 重新绑定纹理
            that.webGLUpdateBuffer(flatObj);
        }
        else if (flatObj.changePosition) {
            flatObj.position.Alpha = 1;
        }

        //如果是移门热点的四个顶点按钮
        if (flatObj.typeName.type == "slideDoor_focus") {
            //重新生成矩阵 重新绑定纹理
            that.webGLUpdateBuffer(flatObj);
        }

        //处理移门热点的相关事项
        for (let i in hotList) {
            if (hotList[i].typeName.name === "hot" && hotList[i].typeName.type === "slideDoor") {
                let typeName = hotList[i].typeName;
                //首先判断是否处于焦点状态下
                if (typeName.focus) {
                    //再判断现在的定时器是什么方向
                    if (typeName.direction === "reduce") {
                        clearInterval(typeName.interval);
                        //默认状态下的话，修改方向，增加定时器
                        typeName.interval = setInterval(function () {
                            typeName.index++;
                            if (typeName.index >= typeName.data.length) {
                                //判断是否可以循环播放
                                if (typeName.cyclic) {
                                    typeName.index = 0;
                                }
                                else {
                                    typeName.index = typeName.data.length - 1;
                                    clearInterval(typeName.interval);
                                }
                            }
                            //重新绘制
                            typeName.canvas.changeImage(typeName.data[typeName.index].src);
                        }, slideDoor.timeDelay);
                        typeName.direction = "increase";
                    }
                }
                else {
                    //如果不处于焦点状态
                    if (typeName.direction === "increase") {
                        clearInterval(typeName.interval);
                        //默认状态下的话，修改方向，增加定时器
                        typeName.interval = setInterval(function () {
                            typeName.index--;
                            if (typeName.index <= 0) {
                                typeName.index = 0;
                                clearInterval(typeName.interval);
                            }
                            //重新绘制
                            typeName.canvas.changeImage(typeName.data[typeName.index].src);
                        }, slideDoor.timeDelay);
                        typeName.direction = "reduce";
                    }
                }
            }
        }

        //如果播放器在播放
        if (that.action_hot_video.canvas) {
            that.action_hot_video.canvas.drawing();
        }
    },
    //*绘制当前漫游的热点对象
    drawAll: function () {

        //判断是否处于vr状态
        var isGyroMode = this.state.type;
        //先绘制普通的
        if (isGyroMode != "gyro") {
            for (var key in this.hotSpotList) {
                var obj = this.hotSpotList[key];
                //如果没有启用绘制将不绘制该对象
                if (obj.isShow) this.drawFlat(obj);
            }
        }
        //再绘制移门热点
        for (var key in this.hotSlideList) {
            var obj = this.hotSlideList[key];
            //如果没有启用绘制将不绘制该对象
            if (obj.isShow) this.drawSlideDoor(obj);
        }
    },
    //清除当前漫游的热点对象
    clearDrawAll: function () {
        this.hotSpotDrawList = [];
    },
    //清除所有漫游的热点对象
    clearAll: function () {
        let state = this.state;
        //清空绘制
        this.clearDrawAll();
        //清空热点列表
        delete this.hotSpotList;
        this.hotSpotList = {};
        //清空移门热点列表
        delete this.hotSlideList;
        this.hotSlideList = {};

        //清除定时器
        for (let i = 0; i < state.interval.length; i++) {
            clearInterval(state.interval[i]);
        }
        state.interval = [];
    },
    //绘制当前漫游的热点对象
    show: function () {
        this.drawAll();
    },
    //*清除WebGL模型对象
    gl_clearBuffer: function (ModelObj) {
        var webGLInfo = this.playerObj.api_getWebGLInfo();
        var gl = webGLInfo.webGL;
        if (ModelObj && ModelObj.vertexBuffer) {
            //清除球模型buffer数据
            gl.deleteBuffer(ModelObj.vertexBuffer);
            gl.deleteBuffer(ModelObj.textureBuffer);
            gl.deleteBuffer(ModelObj.indexBuffer);
            gl.deleteTexture(ModelObj.texture);
        }
    },

    //*----------------------------------------------------动作捕获-------------------------------------------------------------

    //检测当前的鼠标位置是否在某个模型上面
    check: function (e) {
        let x = EventUtil.getOffsetX(e), y = EventUtil.getOffsetY(e);
        let that = this;
        for (let i = 0; i < that.hotSpotDrawList.length; i++) {
            if (that.hotSpotDrawList[i].checkRayCast(x, y, that.hotSpotDrawList[i])) {
                return true; //如果当前焦点，则返回true
            }
        }

        //如果没有焦点，返回false
        return false;
    },
    //当前鼠标点击位置是否有事件触发
    click: function (e) {
        let x = EventUtil.getOffsetX(e), y = EventUtil.getOffsetY(e);
        return this.clickCheck(x, y); //如果有事件触发，则返回true
    },
    //鼠标移动事件
    mouse: function (e) {
        let x = EventUtil.getOffsetX(e), y = EventUtil.getOffsetY(e);
        this.mouseX = x;
        this.mouseY = y;
    },
    //鼠标按下事件检查
    down: function (e) {
        let x = EventUtil.getOffsetX(e), y = EventUtil.getOffsetY(e);
        this.downCheck(x, y, e);
    },
    mouseGyro: function () {
        //非VR模式直接返回
        this.setPointerSize();
    },
    //陀螺仪捕获检查
    gyroCheck: function () {
        //todo:判断是否 可被捕获，和 是否被捕获
        let isGyroMode = this.playerObj.api_getVRMode();
        //非VR模式直接返回
        if (!isGyroMode) return;
        let self = this;
        this.fireFocus = false;
        //console.log(this.hotSpotDrawList);
        let hotArr = []; //当前焦点的所有对象

        //源代码备份
        /*for (var i = 0; i < this.hotSpotDrawList.length; i++) {
         if (this.hotSpotDrawList[i].actions && this.hotSpotDrawList[i].isFocus) {
         self.fireFocus = true;
         self.gyroFireEvent(this.hotSpotDrawList[i]);
         }
         else {
         this.hotSpotDrawList[i].isFocus = false;
         window.clearTimeout(this.hotSpotDrawList[i].fireEvent);
         this.hotSpotDrawList[i].fireEvent = null;
         }
         }*/
        //先获取所有的焦点的对象
        for (let i = 0; i < this.hotSpotDrawList.length; i++) {
            if (this.hotSpotDrawList[i].isFocus) {
                //console.log(this.hotSpotDrawList[i], this.hotSpotDrawList[i].isFocus);
                hotArr.push(this.hotSpotDrawList[i]);
            }
            else {
                //判断是否需要触发mouseLeave事件
                if (this.hotSpotDrawList[i].typeName.isOver) {
                    self.downActions(this.hotSpotDrawList[i], null, "mouse_leave");
                    this.hotSpotDrawList[i].typeName.isOver = false;
                }
                this.hotSpotDrawList[i].isFocus = false;
                window.clearTimeout(this.hotSpotDrawList[i].fireEvent);
                this.hotSpotDrawList[i].fireEvent = null;
            }
        }

        //然后只处理最上面的一个对象
        for (let j = 0; j < hotArr.length; j++) {
            if (hotArr[j].actions && (j === hotArr.length - 1)) {
                //判断是否需要触发mouseenter事件
                if (!hotArr[j].typeName.isOver) {
                    self.downActions(hotArr[j], null, "mouse_enter"); //触发进入事件
                }
                hotArr[j].typeName.isOver = true; //悬停在模型上的key

                //图形上面有事件，并且还是最上层
                self.fireFocus = true;
                self.gyroFireEvent(hotArr[j]);
            }
            else {
                //判断是否需要触发mouseLeave事件
                if (hotArr[j].typeName.isOver) {
                    self.downActions(hotArr[j], null, "mouse_leave");
                }
                hotArr[j].typeName.isOver = false;
                //不是最上层
                hotArr[j].isFocus = false;
                window.clearTimeout(hotArr[j].fireEvent);
                hotArr[j].fireEvent = null;
            }
        }

        //设置是否处在工具栏焦点上
        self.setToolBar(hotArr);

        //针对最后一个属性进行判断
        self.checkLastModelActions(hotArr[hotArr.length - 1]);
    },
    //鼠标点击捕获检查
    clickCheck: function (x, y) {
        let self = this;
        for (let i = 0; i < this.hotSpotDrawList.length; i++) {
            if (this.hotSpotDrawList[i].actions && this.hotSpotDrawList[i].checkRayCast(x, y, this.hotSpotDrawList[i])) {
                //立即响应事件
                this.hotSpotDrawList[i].isFocus = true;
                self.checkActions(this.hotSpotDrawList[i]);
                return this.hotSpotDrawList[i]; //如果有事件触发，则返回true
            }
            else {
                //立即响应事件
                this.hotSpotDrawList[i].isFocus = false;
            }
        }

        //如果没有事件触发，返回false
        return false;
    },
    //鼠标按下捕获检查
    downCheck: function (x, y, e) {
        let self = this;
        //声明一个存储所有触发事件的热点数组集合
        let focusArr = [];
        for (let i = 0; i < this.hotSpotDrawList.length; i++) {
            if (this.hotSpotDrawList[i].actions && this.hotSpotDrawList[i].checkRayCast(x, y, this.hotSpotDrawList[i])) {
                focusArr.push(this.hotSpotDrawList[i]);
            }
        }

        //只触发最后一个 立即响应事件
        if (focusArr.length <= 0) return;
        self.downActions(focusArr[focusArr.length - 1], e, "mouse_down");
    },
    //鼠标按下后事件监测
    downActions: function (obj, event, type) {
        if (!obj.actions) return;
        let self = this;
        //console.log(type);

        //执行热点上面所有的动作
        for (let i = 0; i < obj.actions.length; i++) {
            var actionsTriggers = obj.actions[i].Triggers;
            if (actionsTriggers.Type === type) {
                var actionsName = obj.actions[i].Name;
                var actionsParams = obj.actions[i].Params;
                actionsParams.event = event;
                //todo:触发鼠标按下事件
                self[actionsName] && self[actionsName](actionsParams, obj);
            }
        }
    },
    //陀螺仪响应热点事件
    gyroFireEvent: function (flatObj) {
        //todo:如果对象上面有执行句柄 不进行操作
        if (flatObj.fireEvent) return;
        this.checkActions(flatObj, this.fireTime);
    },
    //捕获后的动作检测
    checkActions: function (obj, delayTime) {
        if (!obj.actions) return;
        let self = this;
        //执行热点上面所有的动作
        for (let i = 0; i < obj.actions.length; i++) {
            self.execActions(obj.actions[i], obj, delayTime);
        }
    },
    //触发相关的事件
    execActions: function (actionsObj, HSObj, delay_time) {
        //如果库里面没有对应的动作就不执行
        if (!this[actionsObj.Name]) return;
        let actionsName = actionsObj.Name;
        let actionsParams = actionsObj.Params;
        let actionsTriggers = actionsObj.Triggers;
        let delayTime = actionsTriggers.Delay || delay_time;
        let self = this;

        //判断一下是click事件还是悬停事件

        if (actionsTriggers.Type === "mouse_click") {
            if (!HSObj) {
                //todo:非热点动作处理
                if (delayTime === 0) {
                    !self.isLoading && self[actionsName] && self[actionsName](actionsParams, HSObj);
                }
                else {
                    window.setTimeout(function () {
                        !self.isLoading && self[actionsName] && self[actionsName](actionsParams, HSObj);
                    }, delayTime);
                }
            }
            else {
                //todo:热点动作处理
                if (delayTime === 0) {
                    HSObj.isFocus && !self.isLoading && self[actionsName] && self[actionsName](actionsParams, HSObj);
                }
                else {
                    HSObj.fireEvent = window.setTimeout(function () {
                        HSObj.isFocus && !self.isLoading && self[actionsName] && self[actionsName](actionsParams, HSObj);
                        window.clearTimeout(HSObj.fireEvent);
                        HSObj.fireEvent = null;
                    }, delayTime);
                }
            }
        }
        else if (actionsTriggers.Type === "mouse_hover") {
            //todo:悬停触发事件
            self[actionsName] && self[actionsName](actionsParams, HSObj);
        }
    },
    //个人新增，添加判断焦点悬停的物体上是否有事件触发
    checkLastModelActions: function (obj) {
        let that = this;
        let hotList = that.getAllDrawHot();
        let state = that.state;

        //将移门热点的焦点状态改成false
        for (let i in hotList) {
            if (hotList[i].typeName.type === "slideDoor" && hotList[i].typeName.name === "hot") {
                hotList[i].typeName.focus = false; //如果处于焦点，就想focus属性设置为true
            }
        }

        //判断当前是否处于一个热点的焦点上面
        if (!obj) {
            //如果当前焦点的不是obj，则设置焦点前的对象blur事件
            if (state.focus) {
                //如果前一个焦点是一个对象，则触发一下leave事件
                let obj = state.focus;
                obj.typeName && obj.typeName.callBack && obj.typeName.callBack.vr_leave
                && obj.typeName.callBack.vr_leave.call(that, obj);
            }
            return;
        }
        else {
            //如果焦点的是一个热点对象，则判断当前的情况
            if (state.focus === obj) {
                //如果当前的焦点的和上一次焦点的相同，证明是一直触发悬停移动的事件
                obj.typeName && obj.typeName.callBack && obj.typeName.callBack.vr_move
                && obj.typeName.callBack.vr_move.call(that, obj);
            }
            else {
                //如果当前焦点与上一次的不同
                if (state.focus) {
                    //首先判断上一次的对象是否存在，存在就触发leave事
                    let obj = state.focus;
                    obj.typeName && obj.typeName.callBack && obj.typeName.callBack.vr_leave
                    && obj.typeName.callBack.vr_leave.call(that, obj);
                }
                else {
                    //如果上一次不存在对象
                }

                //不同，将触发对象进入热点对象的enter事件
                obj.typeName && obj.typeName.callBack && obj.typeName.callBack.vr_enter
                && obj.typeName.callBack.vr_enter.call(that, obj);

                //更新state存储的对象
                state.focus = obj;
            }
        }

        //绘制前的一些事件处理
        switch (obj.typeName.name) {
            case "thumbnail-list":
                //如果悬停在缩略图列表上面，显示当前进入目标场景的图标
                let index = obj.typeName.index;
                for (let i in hotList) {
                    if (hotList[i].typeName.name === "thumbnail-list" && hotList[i].typeName.type === "btn") {
                        if (index === hotList[i].typeName.index) {
                            hotList[i].isShow = true;
                        }
                        else {
                            hotList[i].isShow = false;
                        }
                    }
                }

                //如果焦点的是title，则触发滚动title事件
                if (obj.typeName.type === "title") {
                    obj.typeName.canvas.moveStep();
                }
                break;
            case "thumbnail":
                //如果悬停在了缩略图相关图形上，而不是缩略图列表上面，将切换按钮隐藏掉。
                for (let i in hotList) {
                    if (hotList[i].typeName.name === "thumbnail-list" && hotList[i].typeName.type === "btn") {
                        hotList[i].isShow = false;
                    }
                }
                break;
            case "hot":
                if (obj.typeName.type === "slideDoor") {
                    obj.typeName.focus = true; //如果处于焦点，就想focus属性设置为true
                }
                break;
            case "hot-pic":
                if (obj.typeName.type === "changePosition") {
                    obj.position.Alpha = 1;
                }
                break;
        }

        //触发图片操作按钮显示事件 - 已经废弃
        /*if (that.action_hot_pic.canvas || that.action_hot_plane.canvas) {
            var checkPosition = function (position) {
                for (var i in hotList) {
                    var hotObj = hotList[i];
                    if (hotObj.typeName.name === "hot-pic" && hotObj.typeName.type === "changePosition") {
                        //获取热点图片的实际大小
                        var width = hotObj.position.Width;
                        var height = hotObj.position.Height;

                        //获取图形的中心点
                        var positionObj = that.computeTwoDistance({
                            pan: hotObj.position.Pan,
                            tilt: hotObj.position.Tilt
                        }, {
                            pan: position.pan,
                            tilt: position.tilt
                        });
                        var x = positionObj.x / 45 * 0.9;
                        var y = positionObj.y / 45 * 0.9;

                        //获得热点的上下左右的边
                        var left = hotObj.position.Tx - width / 2 / 500;
                        var right = hotObj.position.Tx + width / 2 / 500;
                        var top = hotObj.position.Ty + height / 2 / 500;
                        var bottom = hotObj.position.Ty - height / 2 / 500;

                        //判断是否处在图形上方
                        if (x < right && x > left && y > bottom && y < top) {
                            hotObj.isShow = true;
                        }
                        else {
                            hotObj.isShow = true;
                        }
                    }
                }
            };

            checkPosition(position);
        }*/
    },
    //*------------------------------------------------------工具栏---------------------------------------------------------

    //添加vr工具栏
    addToolBar: function () {
        let setting = this.toolSetting.tool;
        let that = this;

        //当前工具栏默认生成后的位置
        //先获取场景的中心点
        let position = that.getPTF();

        let positionPan = /*that.twoPointsDistance.pan*//*position.pan*/0;
        let positionTilt = /*that.twoPointsDistance.tilt*//*position.tilt*/-90;

        let toolBar = [
            //背景
            {
                "HotspotID": "toolBarBackground",
                "Name": "",
                "Type": "Image",
                "Attributes": {
                    "ImageNormal": setting["toolBarBackground"]
                },
                "Positions": [{
                    "Alpha": 1,
                    "Pan": positionPan,
                    "Tilt": positionTilt,
                    "Rx": 0,
                    "Ry": 0,
                    "Rz": 0,
                    "Tx": 0,
                    "Ty": 0,
                    "Sx": 1,
                    "Sy": 1,
                    "Width": setting["toolBarWidth"],
                    "Height": setting["toolBarHeight"]
                }],
                typeName: { //明确具体的功能位置
                    name: "tool"
                },
                changePosition: true,
                modelType: "tool" //设置绘制的图形的类别
            },
            //从左侧数第一个工具栏按钮
            {
                "Actions": [{
                    "Name": "action_prevScene",
                    "Triggers": {"Type": "mouse_click", "Delay": 0},
                    "Params": {"SceneID": "vr3", "Quality": 2, "Time": 0, "Pan": 180, "Tilt": null}
                }],
                "HotspotID": "toolBarOne",
                "Name": "",
                "Type": "Image",
                "Attributes": {
                    "ImageNormal": setting["toolBarOneIcon"],
                    "ImageOver": setting["toolBarOneIcon"]
                },
                "Positions": [{
                    "Alpha": 1,
                    "Pan": positionPan,
                    "Tilt": positionTilt,
                    "Rx": 0,
                    "Ry": 0,
                    "Rz": 0,
                    "Tx": -0.21,
                    "Ty": 0,
                    "Sx": 1,
                    "Sy": 1,
                    "Width": setting["toolBarIconWidth"],
                    "Height": setting["toolBarIconHeight"]
                }],
                typeName: { //明确具体的功能位置
                    name: "tool"
                },
                changePosition: true,
                modelType: "tool" //设置绘制的图形的类别
            },
            //从左侧数第二个工具栏按钮
            {
                "Actions": [{
                    "Name": "action_tool_thumbnail",
                    "Triggers": {"Type": "mouse_click", "Delay": 0},
                    "Params": {sceneArr: that.sceneArr}
                }],
                "HotspotID": "toolBarTwo",
                "Name": "",
                "Type": "Image",
                "Attributes": {
                    "ImageNormal": setting["toolBarTwoIcon"],
                    "ImageOver": setting["toolBarTwoIcon"]
                },
                "Positions": [{
                    "Alpha": 1,
                    "Pan": positionPan,
                    "Tilt": positionTilt,
                    "Rx": 0,
                    "Ry": 0,
                    "Rz": 0,
                    "Tx": -0.09,
                    "Ty": 0,
                    "Sx": 1,
                    "Sy": 1,
                    "Width": setting["toolBarIconWidth"],
                    "Height": setting["toolBarIconHeight"]
                }],
                typeName: { //明确具体的功能位置
                    name: "tool"
                },
                changePosition: true,
                modelType: "tool" //设置绘制的图形的类别
            },
            //从左侧数第三个工具栏按钮
            {
                "Actions": [{
                    "Name": "action_hot_plane",
                    "Triggers": {"Type": "mouse_click", "Delay": 0},
                    "Params": {"SceneID": "vr3", "Quality": 2, "Time": 0, "Pan": 180, "Tilt": null}
                }],
                "HotspotID": "toolBarThree",
                "Name": "",
                "Type": "Image",
                "Attributes": {
                    "ImageNormal": setting["toolBarThreeIcon"],
                    "ImageOver": setting["toolBarThreeIcon"]
                },
                "Positions": [{
                    "Alpha": 1,
                    "Pan": positionPan,
                    "Tilt": positionTilt,
                    "Rx": 0,
                    "Ry": 0,
                    "Rz": 0,
                    "Tx": 0.09,
                    "Ty": 0,
                    "Sx": 1,
                    "Sy": 1,
                    "Width": setting["toolBarIconWidth"],
                    "Height": setting["toolBarIconHeight"]
                }],
                typeName: { //明确具体的功能位置
                    name: "tool"
                },
                changePosition: true,
                modelType: "tool" //设置绘制的图形的类别
            },
            //从左侧数第四个工具栏按钮
            {
                "Actions": [{
                    "Name": "action_nextScene",
                    "Triggers": {"Type": "mouse_click", "Delay": 0},
                    "Params": {"SceneID": "vr3", "Quality": 2, "Time": 0, "Pan": 180, "Tilt": null}
                }],
                "HotspotID": "toolBarFour",
                "Name": "",
                "Type": "Image",
                "Attributes": {
                    "ImageNormal": setting["toolBarFourIcon"],
                    "ImageOver": setting["toolBarFourIcon"]
                },
                "Positions": [{
                    "Alpha": 1,
                    "Pan": positionPan,
                    "Tilt": positionTilt,
                    "Rx": 0,
                    "Ry": 0,
                    "Rz": 0,
                    "Tx": 0.21,
                    "Ty": 0,
                    "Sx": 1,
                    "Sy": 1,
                    "Width": setting["toolBarIconWidth"],
                    "Height": setting["toolBarIconHeight"]
                }],
                typeName: { //明确具体的功能位置
                    name: "tool"
                },
                changePosition: true,
                modelType: "tool" //设置绘制的图形的类别
            }
        ];

        //创建热点对象
        let arr = toolBar;
        for (let i = 0, len = arr.length; i < len; i++) {
            let obj = that.createHost(arr[i], false);
            //将当前的需要动态修改的position添加到obj上
            if (arr[i].changePosition) {
                obj.changePosition = true;
                //添加obj的modelType为工具栏tool
                obj.modelType = "tool";
            }
            obj.typeName = arr[i].typeName;
            obj.isShow = true;//是否显示
            obj.position = arr[i].Positions[0];
            that.hotSpotList[arr[i].HotspotID] = obj;
        }
    },
    //设置是否焦点到工具栏
    setToolBar: function (obj) {
        var len = obj.length;
        if (len === 0) return (this.addToolBar.bool = false);
        if (obj[len - 1].modelType === "tool") {
            this.addToolBar.bool = true;
        }
        else {
            this.addToolBar.bool = false;
        }
    },
    //获取当前状态是否焦点到工具栏
    getToolBar: function () {
        return this.addToolBar.bool;
    },
    //*------------------------------------------------------弹框---------------------------------------------------------
    _Alert_init: function () {
        var setting = this.toolSetting.alert;
        var that = this;

        //先删除所有的弹框
        that.action_closeAlert();

        //获取当前vr焦点的ptf
        var position = this.getPTF();

        //弹框数据
        var arr = [
            {
                "HotspotID": "AlertBarBackground",//弹框的背景底色
                "Name": "",
                "Type": "Image",
                "Attributes": {
                    "ImageNormal": setting["alertBackgroundImageNormal"],
                    "ImageOver": setting["alertBackgroundImageNormal"]
                },
                "Positions": [{
                    "Alpha": setting["alertBackgroundAlpha"],
                    "Pan": position.pan,
                    "Tilt": 0,
                    "Rx": 0,
                    "Ry": 0,
                    "Rz": 0,
                    "Tx": 0,
                    "Ty": 0,
                    "Sx": 1,
                    "Sy": 1,
                    "Width": setting["alertWidth"],
                    "Height": setting["alertHeight"]
                }],
                typeName: { //明确具体的功能位置
                    name: "alert"
                },
                modelType: "alert" //设置绘制的图形的类别
            },
            {
                "Actions": [{
                    "Name": "action_closeAlert",
                    "Triggers": {"Type": "mouse_click", "Delay": 0},
                    "Params": {type: "close", value: "关闭弹框的按钮"}
                }],
                "HotspotID": "AlertClose", //弹框的关闭按钮
                "Name": "",
                "Type": "Image",
                "Attributes": {
                    "ImageNormal": setting["alertCloseBackgroundImageNormal"],
                    "ImageOver": setting["alertCloseBackgroundImageOver"]
                },
                "Positions": [{
                    "Alpha": 1,
                    "Pan": position.pan,
                    "Tilt": 0,
                    "Rx": 0,
                    "Ry": 0,
                    "Rz": 0,
                    "Tx": setting["alertCloseTranslateX"],
                    "Ty": setting["alertCloseTranslateY"],
                    "Sx": 1,
                    "Sy": 1,
                    "Width": setting["alertCloseWidth"],
                    "Height": setting["alertCloseHeight"]
                }],
                typeName: { //明确具体的功能位置
                    name: "alert"
                },
                modelType: "alert" //设置绘制的图形的类别
            }
        ];

        for (var i = 0, len = arr.length; i < len; i++) {
            var obj = that.createHost(arr[i], false);
            //添加上modelType
            obj.modelType = arr[i].modelType;
            obj.typeName = arr[i].typeName;
            obj.isShow = true;//是否显示
            obj.position = arr[i].Positions[0];
            that.hotSpotList[arr[i].HotspotID] = obj;
        }
    },
    //*关闭弹框
    action_closeAlert: function () {
        var that = this;
        //循环判断modelType是否为alert
        for (var i in that.hotSpotList) {
            if (that.hotSpotList[i].modelType === "alert") {
                that.hotSpotList[i] = null;
                delete that.hotSpotList[i];
            }
        }

        //清空相关的canvas属性
        that.closeCanvas();
    },
    //*----------------------------------------------- 工具栏thumbnail 事件---------------------------------------------------
    action_tool_thumbnail: function () {
        var setting = this.toolSetting.thumbnail;
        var that = this;

        //获取当前vr焦点的ptf
        var position = this.getPTF();

        //初始化弹框
        this._Alert_init();

        var arr = [
            {
                "HotspotID": "AlertContentWrap", //图片显示区域的背景
                "Name": "",
                "Type": "Image",
                "Attributes": {
                    "ImageNormal": setting["thumbnailContentWrapBackgroundImageNormal"],
                    "ImageOver": setting["thumbnailContentWrapBackgroundImageOver"]
                },
                "Positions": [{
                    "Alpha": 1,
                    "Pan": position.pan,
                    "Tilt": 0,
                    "Rx": 0,
                    "Ry": 0,
                    "Rz": 0,
                    "Tx": 0,
                    "Ty": setting["thumbnailContentWrapTranslateY"],
                    "Sx": 1,
                    "Sy": 1,
                    "Width": setting["thumbnailContentWrapWidth"],
                    "Height": setting["thumbnailContentWrapHeight"]
                }],
                typeName: { //明确具体的功能位置
                    name: "thumbnail"
                },
                modelType: "alert" //设置绘制的图形的类别
            },
            {
                "Actions": [{
                    "Name": "action_tool_changeThumbnail",
                    "Triggers": {"Type": "mouse_click", "Delay": 0},
                    "Params": {type: "prev", value: "切换上一组thumbnail"}
                }],
                "HotspotID": "AlertThumbnailPrev", //切换上一组thumbnail
                "Name": "",
                "Type": "Image",
                "Attributes": {
                    "ImageNormal": setting["thumbnailPrevBackgroundImageNormal"],
                    "ImageOver": setting["thumbnailPrevBackgroundImageOver"]
                },
                "Positions": [{
                    "Alpha": 1,
                    "Pan": position.pan,
                    "Tilt": 0,
                    "Rx": 0,
                    "Ry": 0,
                    "Rz": 0,
                    "Tx": setting["thumbnailPrevTranslateX"],
                    "Ty": setting["thumbnailPrevTranslateY"],
                    "Sx": 1,
                    "Sy": 1,
                    "Width": setting["thumbnailPrevWidth"],
                    "Height": setting["thumbnailPrevHeight"]
                }],
                typeName: { //明确具体的功能位置
                    name: "thumbnail"
                },
                modelType: "alert" //设置绘制的图形的类别
            },
            {
                "Actions": [{
                    "Name": "action_tool_changeThumbnail",
                    "Triggers": {"Type": "mouse_click", "Delay": 0},
                    "Params": {type: "next", value: "切换下一组thumbnail"}
                }],
                "HotspotID": "AlertThumbnailNext", //切换下一组thumbnail
                "Name": "",
                "Type": "Image",
                "Attributes": {
                    "ImageNormal": setting["thumbnailNextBackgroundImageNormal"],
                    "ImageOver": setting["thumbnailNextBackgroundImageOver"]
                },
                "Positions": [{
                    "Alpha": 1,
                    "Pan": position.pan,
                    "Tilt": 0,
                    "Rx": 0,
                    "Ry": 0,
                    "Rz": 0,
                    "Tx": setting["thumbnailNextTranslateX"],
                    "Ty": setting["thumbnailNextTranslateY"],
                    "Sx": 1,
                    "Sy": 1,
                    "Width": setting["thumbnailNextWidth"],
                    "Height": setting["thumbnailNextHeight"]
                }],
                typeName: { //明确具体的功能位置
                    name: "thumbnail"
                },
                modelType: "alert" //设置绘制的图形的类别
            }
        ];

        for (var i = 0, len = arr.length; i < len; i++) {
            var obj = that.createHost(arr[i], false);
            //添加上modelType
            obj.modelType = arr[i].modelType;
            obj.typeName = arr[i].typeName;
            obj.isShow = true;//是否显示
            obj.position = arr[i].Positions[0];
            that.hotSpotList[arr[i].HotspotID] = obj;
        }

        //实例化thumbnail对象
        that.action_tool_thumbnail.canvas = that._canvasDrawThumbnail({
            sceneArr: that.sceneArr, //所有场景数据
            settings: setting, //thumbnail相关设置
            hotSpotManager: that, //vr全局对象k
            thumbnailPan: position.pan //图片的Pan值
        });
        that.action_tool_thumbnail.canvas.init();
    },
    //翻页方法
    action_tool_changeThumbnail: function (data) {
        if (data.type === "prev") {
            this.action_tool_thumbnail.canvas.prev();
        }
        else if (data.type === "next") {
            this.action_tool_thumbnail.canvas.next();
        }
    },
    //*------------------------------------------------------图片热点事件------------------------------------------
    action_hot_pic: function (data) {
        let setting = this.toolSetting.hotPic;
        let that = this;

        let pics = data.value;

        //获取当前vr焦点的ptf
        let position = this.getPTF();

        //初始化弹框
        this._Alert_init();

        //实例化canvas绘制纹理对象
        that.action_hot_pic.canvas = this._canvasDrawPic({
            imgPath: pics[0].src,
            canvasWidth: setting["hotPicContentWrapWidth"],
            canvasHeight: setting["hotPicContentWrapHeight"]
        });

        let arr = [
            {
                "HotspotID": "AlertContentWrap", //图片显示区域的背景
                "Name": "",
                "Type": "Image",
                "Attributes": {
                    "ImageNormal": setting["hotPicContentWrapBackgroundImageNormal"],
                    "ImageOver": setting["hotPicContentWrapBackgroundImageNormal"]
                },
                "Positions": [{
                    "Alpha": 1,
                    "Pan": position.pan,
                    "Tilt": 0,
                    "Rx": 0,
                    "Ry": 0,
                    "Rz": 0,
                    "Tx": 0,
                    "Ty": setting["hotPicContentWrapTranslateY"],
                    "Sx": 1,
                    "Sy": 1,
                    "Width": setting["hotPicContentWrapWidth"],
                    "Height": setting["hotPicContentWrapHeight"]
                }],
                modelType: "alert", //设置绘制的图形的类别
                typeName: {
                    name: "hot-pic",
                    type: "picBack"
                }
            },
            {
                "HotspotID": "AlertContentPic", //显示图片纹理的模型
                "Name": "",
                "Type": "Image",
                "Attributes": {},
                Canvas: {
                    CanvasNormal: that.action_hot_pic.canvas.getCanvas(),
                    CanvasOver: that.action_hot_pic.canvas.getCanvas()
                },
                "Positions": [{
                    "Alpha": 1,
                    "Pan": position.pan,
                    "Tilt": 0,
                    "Rx": 0,
                    "Ry": 0,
                    "Rz": 0,
                    "Tx": 0,
                    "Ty": setting["hotPicContentWrapTranslateY"],
                    "Sx": 1,
                    "Sy": 1,
                    "Width": setting["hotPicContentWrapWidth"],
                    "Height": setting["hotPicContentWrapHeight"]
                }],
                modelType: "alert", //设置绘制的图形的类别
                typeName: {
                    name: "hot-pic",
                    type: "picContent"
                }
            },
            {
                "Actions": [{
                    "Name": "action_hot_changePic",
                    "Triggers": {"Type": "mouse_click", "Delay": 0},
                    "Params": {type: "prev", value: "切换左边一张图片"}
                }],
                "HotspotID": "AlertPicPrev", //图片向左切换的按钮
                "Name": "",
                "Type": "Image",
                "Attributes": {
                    "ImageNormal": setting["hotPicPrevBackgroundImageNormal"],
                    "ImageOver": setting["hotPicPrevBackgroundImageOver"]
                },
                "Positions": [{
                    "Alpha": 1,
                    "Pan": position.pan,
                    "Tilt": 0,
                    "Rx": 0,
                    "Ry": 0,
                    "Rz": 0,
                    "Tx": setting["hotPicPrevTranslateX"],
                    "Ty": setting["hotPicPrevTranslateY"],
                    "Sx": 1,
                    "Sy": 1,
                    "Width": setting["hotPicPrevWidth"],
                    "Height": setting["hotPicPrevHeight"]
                }],
                modelType: "alert", //设置绘制的图形的类别
                typeName: {
                    name: "hot-pic",
                    type: "changePic"
                }
            },
            {
                "Actions": [{
                    "Name": "action_hot_changePic",
                    "Triggers": {"Type": "mouse_click", "Delay": 0},
                    "Params": {type: "next", value: "切换右边一张图片"}
                }],
                "HotspotID": "AlertPicNext", //切换右边一张图片按钮
                "Name": "",
                "Type": "Image",
                "Attributes": {
                    "ImageNormal": setting["hotPicNextBackgroundImageNormal"],
                    "ImageOver": setting["hotPicNextBackgroundImageOver"]
                },
                "Positions": [{
                    "Alpha": 1,
                    "Pan": position.pan,
                    "Tilt": 0,
                    "Rx": 0,
                    "Ry": 0,
                    "Rz": 0,
                    "Tx": setting["hotPicNextTranslateX"],
                    "Ty": setting["hotPicNextTranslateY"],
                    "Sx": 1,
                    "Sy": 1,
                    "Width": setting["hotPicNextWidth"],
                    "Height": setting["hotPicNextHeight"]
                }],
                modelType: "alert", //设置绘制的图形的类别
                typeName: {
                    name: "hot-pic",
                    type: "changePic"
                }
            },
            {
                "Actions": [{
                    "Name": "action_hot_changePic",
                    "Triggers": {"Type": "mouse_hover", "Delay": 0},
                    "Params": {type: "enlarge", value: "对图片进行放大"}
                }],
                "HotspotID": "AlertPicEnlarge", //图片的放大按钮
                "Name": "",
                "Type": "Image",
                "Attributes": {
                    "ImageNormal": setting["hotPicEnlargeBackgroundImageNormal"],
                    "ImageOver": setting["hotPicEnlargeBackgroundImageOver"]
                },
                "Positions": [{
                    "Alpha": 1,
                    "Pan": position.pan,
                    "Tilt": 0,
                    "Rx": 0,
                    "Ry": 0,
                    "Rz": 0,
                    "Tx": setting["hotPicEnlargeTranslateX"],
                    "Ty": setting["hotPicEnlargeTranslateY"],
                    "Sx": 1,
                    "Sy": 1,
                    "Width": setting["hotPicEnlargeWidth"],
                    "Height": setting["hotPicEnlargeHeight"]
                }],
                modelType: "alert", //设置绘制的图形的类别
                typeName: {
                    name: "hot-pic",
                    type: "picScale"
                }
            },
            {
                "Actions": [{
                    "Name": "action_hot_changePic",
                    "Triggers": {"Type": "mouse_hover", "Delay": 0},
                    "Params": {type: "narrow", value: "对图片进行缩小"}
                }],
                "HotspotID": "AlertPicNarrow", //图片的放大按钮
                "Name": "",
                "Type": "Image",
                "Attributes": {
                    "ImageNormal": setting["hotPicNarrowBackgroundImageNormal"],
                    "ImageOver": setting["hotPicNarrowBackgroundImageOver"]
                },
                "Positions": [{
                    "Alpha": 1,
                    "Pan": position.pan,
                    "Tilt": 0,
                    "Rx": 0,
                    "Ry": 0,
                    "Rz": 0,
                    "Tx": setting["hotPicNarrowTranslateX"],
                    "Ty": setting["hotPicNarrowTranslateY"],
                    "Sx": 1,
                    "Sy": 1,
                    "Width": setting["hotPicNarrowWidth"],
                    "Height": setting["hotPicNarrowHeight"]
                }],
                modelType: "alert", //设置绘制的图形的类别
                typeName: {
                    name: "hot-pic",
                    type: "picScale"
                }
            },
            {
                "Actions": [{
                    "Name": "action_hot_changePic",
                    "Triggers": {"Type": "mouse_hover", "Delay": 0},
                    "Params": {type: "left", value: "图片向左移动"}
                }],
                "HotspotID": "AlertPicLeft", //图片向左移动按钮
                "Name": "",
                "Type": "Image",
                "Attributes": {
                    "ImageNormal": setting["hotPicLeftBackgroundImageNormal"],
                    "ImageOver": setting["hotPicLeftBackgroundImageOver"]
                },
                "Positions": [{
                    "Alpha": 1,
                    "Pan": position.pan,
                    "Tilt": 0,
                    "Rx": 0,
                    "Ry": 0,
                    "Rz": 0,
                    "Tx": setting["hotPicLeftTranslateX"],
                    "Ty": setting["hotPicLeftTranslateY"],
                    "Sx": 1,
                    "Sy": 1,
                    "Width": setting["hotPicLeftWidth"],
                    "Height": setting["hotPicLeftHeight"]
                }],
                modelType: "alert", //设置绘制的图形的类别
                typeName: {
                    name: "hot-pic",
                    type: "changePosition"
                }
            },
            {
                "Actions": [{
                    "Name": "action_hot_changePic",
                    "Triggers": {"Type": "mouse_hover", "Delay": 0},
                    "Params": {type: "up", value: "图片向上移动"}
                }],
                "HotspotID": "AlertPicUp", //图片向上移动的按钮
                "Name": "",
                "Type": "Image",
                "Attributes": {
                    "ImageNormal": setting["hotPicUpBackgroundImageNormal"],
                    "ImageOver": setting["hotPicUpBackgroundImageOver"]
                },
                "Positions": [{
                    "Alpha": 1,
                    "Pan": position.pan,
                    "Tilt": 0,
                    "Rx": 0,
                    "Ry": 0,
                    "Rz": 0,
                    "Tx": setting["hotPicUpTranslateX"],
                    "Ty": setting["hotPicUpTranslateY"],
                    "Sx": 1,
                    "Sy": 1,
                    "Width": setting["hotPicUpWidth"],
                    "Height": setting["hotPicUpHeight"]
                }],
                modelType: "alert", //设置绘制的图形的类别
                typeName: {
                    name: "hot-pic",
                    type: "changePosition"
                }
            },
            {
                "Actions": [{
                    "Name": "action_hot_changePic",
                    "Triggers": {"Type": "mouse_hover", "Delay": 0},
                    "Params": {type: "right", value: "图片向右移动"}
                }],
                "HotspotID": "AlertPicRight", //图片向右移动的按钮
                "Name": "",
                "Type": "Image",
                "Attributes": {
                    "ImageNormal": setting["hotPicRightBackgroundImageNormal"],
                    "ImageOver": setting["hotPicRightBackgroundImageOver"]
                },
                "Positions": [{
                    "Alpha": 1,
                    "Pan": position.pan,
                    "Tilt": 0,
                    "Rx": 0,
                    "Ry": 0,
                    "Rz": 0,
                    "Tx": setting["hotPicRightTranslateX"],
                    "Ty": setting["hotPicRightTranslateY"],
                    "Sx": 1,
                    "Sy": 1,
                    "Width": setting["hotPicRightWidth"],
                    "Height": setting["hotPicRightHeight"]
                }],
                modelType: "alert", //设置绘制的图形的类别
                typeName: {
                    name: "hot-pic",
                    type: "changePosition"
                }
            },
            {
                "Actions": [{
                    "Name": "action_hot_changePic",
                    "Triggers": {"Type": "mouse_hover", "Delay": 0},
                    "Params": {type: "down", value: "图片向下移动"}
                }],
                "HotspotID": "AlertPicDown", //图片向下移动的按钮
                "Name": "",
                "Type": "Image",
                "Attributes": {
                    "ImageNormal": setting["hotPicDownBackgroundImageNormal"],
                    "ImageOver": setting["hotPicDownBackgroundImageOver"]
                },
                "Positions": [{
                    "Alpha": 1,
                    "Pan": position.pan,
                    "Tilt": 0,
                    "Rx": 0,
                    "Ry": 0,
                    "Rz": 0,
                    "Tx": setting["hotPicDownTranslateX"],
                    "Ty": setting["hotPicDownTranslateY"],
                    "Sx": 1,
                    "Sy": 1,
                    "Width": setting["hotPicDownWidth"],
                    "Height": setting["hotPicDownHeight"]
                }],
                modelType: "alert", //设置绘制的图形的类别
                typeName: {
                    name: "hot-pic",
                    type: "changePosition"
                }
            },
            {
                "Actions": [{
                    "Name": "action_hot_changePic",
                    "Triggers": {"Type": "mouse_hover", "Delay": 0},
                    "Params": {type: "leftUp", value: "图片向左上移动"}
                }],
                "HotspotID": "AlertPicLeftUp", //图片向左移动按钮
                "Name": "",
                "Type": "Image",
                "Attributes": {
                    "ImageNormal": setting["hotPicLeftUpBackgroundImageNormal"],
                    "ImageOver": setting["hotPicLeftUpBackgroundImageOver"]
                },
                "Positions": [{
                    "Alpha": 1,
                    "Pan": position.pan,
                    "Tilt": 0,
                    "Rx": 0,
                    "Ry": 0,
                    "Rz": 0,
                    "Tx": setting["hotPicLeftUpTranslateX"],
                    "Ty": setting["hotPicLeftUpTranslateY"],
                    "Sx": 1,
                    "Sy": 1,
                    "Width": setting["hotPicLeftUpWidth"],
                    "Height": setting["hotPicLeftUpHeight"]
                }],
                modelType: "alert", //设置绘制的图形的类别
                typeName: {
                    name: "hot-pic",
                    type: "changePosition"
                }
            },
            {
                "Actions": [{
                    "Name": "action_hot_changePic",
                    "Triggers": {"Type": "mouse_hover", "Delay": 0},
                    "Params": {type: "leftDown", value: "图片向左下移动"}
                }],
                "HotspotID": "AlertPicLeftDown", //图片向左下移动的按钮
                "Name": "",
                "Type": "Image",
                "Attributes": {
                    "ImageNormal": setting["hotPicLeftDownBackgroundImageNormal"],
                    "ImageOver": setting["hotPicLeftDownBackgroundImageOver"]
                },
                "Positions": [{
                    "Alpha": 1,
                    "Pan": position.pan,
                    "Tilt": 0,
                    "Rx": 0,
                    "Ry": 0,
                    "Rz": 0,
                    "Tx": setting["hotPicLeftDownTranslateX"],
                    "Ty": setting["hotPicLeftDownTranslateY"],
                    "Sx": 1,
                    "Sy": 1,
                    "Width": setting["hotPicLeftDownWidth"],
                    "Height": setting["hotPicLeftDownHeight"]
                }],
                modelType: "alert", //设置绘制的图形的类别
                typeName: {
                    name: "hot-pic",
                    type: "changePosition"
                }
            },
            {
                "Actions": [{
                    "Name": "action_hot_changePic",
                    "Triggers": {"Type": "mouse_hover", "Delay": 0},
                    "Params": {type: "rightUp", value: "图片向右上移动"}
                }],
                "HotspotID": "AlertPicRightUp", //图片向右上移动的按钮
                "Name": "",
                "Type": "Image",
                "Attributes": {
                    "ImageNormal": setting["hotPicRightUpBackgroundImageNormal"],
                    "ImageOver": setting["hotPicRightUpBackgroundImageOver"]
                },
                "Positions": [{
                    "Alpha": 1,
                    "Pan": position.pan,
                    "Tilt": 0,
                    "Rx": 0,
                    "Ry": 0,
                    "Rz": 0,
                    "Tx": setting["hotPicRightUpTranslateX"],
                    "Ty": setting["hotPicRightUpTranslateY"],
                    "Sx": 1,
                    "Sy": 1,
                    "Width": setting["hotPicRightUpWidth"],
                    "Height": setting["hotPicRightUpHeight"]
                }],
                modelType: "alert", //设置绘制的图形的类别
                typeName: {
                    name: "hot-pic",
                    type: "changePosition"
                }
            },
            {
                "Actions": [{
                    "Name": "action_hot_changePic",
                    "Triggers": {"Type": "mouse_hover", "Delay": 0},
                    "Params": {type: "rightDown", value: "图片向右下移动"}
                }],
                "HotspotID": "AlertPicRightDown", //图片向右下移动的按钮
                "Name": "",
                "Type": "Image",
                "Attributes": {
                    "ImageNormal": setting["hotPicRightDownBackgroundImageNormal"],
                    "ImageOver": setting["hotPicRightDownBackgroundImageOver"]
                },
                "Positions": [{
                    "Alpha": 1,
                    "Pan": position.pan,
                    "Tilt": 0,
                    "Rx": 0,
                    "Ry": 0,
                    "Rz": 0,
                    "Tx": setting["hotPicRightDownTranslateX"],
                    "Ty": setting["hotPicRightDownTranslateY"],
                    "Sx": 1,
                    "Sy": 1,
                    "Width": setting["hotPicRightDownWidth"],
                    "Height": setting["hotPicRightDownHeight"]
                }],
                modelType: "alert", //设置绘制的图形的类别
                typeName: {
                    name: "hot-pic",
                    type: "changePosition"
                }
            }
        ];


        //处理数据为空的原因
        if (!data.value || data.value.length === 0) {
            arr.length = 0;
        }

        for (let i = 0, len = arr.length; i < len; i++) {
            //如果是操作图形变化的操作按钮，将透明度调低，在焦点状态先，透明度为不透明
            if (arr[i].typeName.type == "changePosition") {
                arr[i].Positions[0].Alpha = 0;
                arr[i].typeName.callBack = {
                    vr_enter: function (obj) {
                        obj.position.Alpha = 1;
                    },
                    vr_leave: function (obj) {
                        obj.position.Alpha = 0;
                    }
                }
            }
            let obj = that.createHost(arr[i], false);
            //添加上modelType
            obj.modelType = arr[i].modelType;
            obj.typeName = arr[i].typeName;
            obj.isShow = true;//是否显示
            obj.position = arr[i].Positions[0];
            that.hotSpotList[arr[i].HotspotID] = obj;
        }

        //将当前显示的图片的坐标存储下来
        that.action_hot_pic.index = 0;

        that.action_hot_pic.len = data.value.length;
        that.action_hot_pic.value = data.value;

        //console.log(that.hotSpotList);
    },
    //热点图片修改图片相关的事件
    action_hot_changePic: function (data) {
        var that = this;
        var canvas = that.action_hot_pic.canvas;

        switch (data.type) {
            case "prev":
                that.action_hot_pic.index--;
                if (that.action_hot_pic.index < 0) {
                    that.action_hot_pic.index = that.action_hot_pic.len - 1;
                }

                canvas.changeImage(that.action_hot_pic.value[that.action_hot_pic.index].src);
                break;
            case "next":
                that.action_hot_pic.index++;
                if (that.action_hot_pic.index >= that.action_hot_pic.len) {
                    that.action_hot_pic.index = 0;
                }
                canvas.changeImage(that.action_hot_pic.value[that.action_hot_pic.index].src);
                break;
            case "left":
                canvas.left();
                break;
            case "up":
                canvas.up();
                break;
            case "right":
                canvas.right();
                break;
            case "down":
                canvas.down();
                break;
            case "leftUp":
                canvas.leftUp();
                break;
            case "leftDown":
                canvas.leftDown();
                break;
            case "rightUp":
                canvas.rightUp();
                break;
            case "rightDown":
                canvas.rightDown();
                break;
            case "enlarge":
                canvas.enlarge();
                break;
            case "narrow":
                canvas.narrow();
                break;
            default:
                return null;
        }


        //通过index重新渲染纹理
        //console.log(that.hotSpotList["AlertContentPic"]);
        /*that.loadImageTexture(that.action_hot_pic.value[that.action_hot_pic.index].src, function (e) {
         this.imageNorObj = e;
         this.imageSelObj = e;
         }.bind(that.hotSpotList["AlertContentPic"]));*/
    },
    //*------------------------------------------------------平面地图事件------------------------------------------
    action_hot_plane: function () {
        var setting = this.toolSetting.planeMap;
        var that = this;
        var selfObj = that.action_hot_plane;

        //生成平面地图数组，去除百度地图和
        selfObj.sceneMap = [];

        for (var i = 0; i < that.sceneMap.length; i++) {
            if (that.sceneMap[i].type === "plane") {
                selfObj.sceneMap.push(that.sceneMap[i]);
            }
        }

        //获取当前vr焦点的ptf
        var position = this.getPTF();

        //初始化弹框
        this._Alert_init();

        if (selfObj.sceneMap.length === 0) {
            //这里书写如果没有平面地图将显示的内容
            var onlyObj = {
                "HotspotID": "AlertContentWrap", //图片显示区域的背景
                "Name": "没有相关内容显示",
                "Type": "Image",
                "Attributes": {},
                "Positions": [{
                    "Alpha": 1,
                    "Pan": position.pan,
                    "Tilt": 0,
                    "Rx": 0,
                    "Ry": 0,
                    "Rz": 0,
                    "Tx": 0,
                    "Ty": setting["hotPicContentWrapTranslateY"],
                    "Sx": 1,
                    "Sy": 1,
                    "Width": setting["hotPicContentWrapWidth"],
                    "Height": setting["hotPicContentWrapHeight"]
                }],
                modelType: "alert", //设置绘制的图形的类别
                typeName: {
                    name: "hot-pic",
                    type: "picBack"
                }
            };

            var obj = that.createHost(onlyObj, false);
            //添加上modelType
            obj.modelType = onlyObj.modelType;
            obj.typeName = onlyObj.typeName;
            obj.isShow = true;//是否显示
            obj.position = onlyObj.Positions[0];
            that.hotSpotList[onlyObj.HotspotID] = obj;
        }

        //实例化canvas绘制纹理对象
        selfObj.canvas = new this._canvasDrawPlane({
            imgPath: selfObj.sceneMap[0].src,
            canvasWidth: setting["hotPicContentWrapWidth"],
            canvasHeight: setting["hotPicContentWrapHeight"],
            HotSpotManager: that, //将主对象传入
            mapData: selfObj.sceneMap[0], //当前显示的平面地图的数据
            pan: position.pan //当前的pan值
        });

        selfObj.canvas.init();

        var arr = [
            {
                "HotspotID": "AlertContentWrap", //图片显示区域的背景
                "Name": "",
                "Type": "Image",
                "Attributes": {
                    "ImageNormal": setting["hotPicContentWrapBackgroundImageNormal"],
                    "ImageOver": setting["hotPicContentWrapBackgroundImageNormal"]
                },
                "Positions": [{
                    "Alpha": 1,
                    "Pan": position.pan,
                    "Tilt": 0,
                    "Rx": 0,
                    "Ry": 0,
                    "Rz": 0,
                    "Tx": 0,
                    "Ty": setting["hotPicContentWrapTranslateY"],
                    "Sx": 1,
                    "Sy": 1,
                    "Width": setting["hotPicContentWrapWidth"],
                    "Height": setting["hotPicContentWrapHeight"]
                }],
                modelType: "alert", //设置绘制的图形的类别
                typeName: {
                    name: "hot-pic",
                    type: "picBack"
                }
            },
            {
                "HotspotID": "AlertContentPic", //显示图片纹理的模型
                "Name": "",
                "Type": "Image",
                "Attributes": {},
                Canvas: {
                    CanvasNormal: selfObj.canvas.getCanvas(),
                    CanvasOver: selfObj.canvas.getCanvas()
                },
                "Positions": [{
                    "Alpha": 1,
                    "Pan": position.pan,
                    "Tilt": 0,
                    "Rx": 0,
                    "Ry": 0,
                    "Rz": 0,
                    "Tx": 0,
                    "Ty": setting["hotPicContentWrapTranslateY"],
                    "Sx": 1,
                    "Sy": 1,
                    "Width": setting["hotPicContentWrapWidth"],
                    "Height": setting["hotPicContentWrapHeight"]
                }],
                modelType: "alert", //设置绘制的图形的类别
                typeName: {
                    name: "hot-pic",
                    type: "picContent"
                }
            },
            {
                "Actions": [{
                    "Name": "action_hot_changePlane",
                    "Triggers": {"Type": "mouse_hover", "Delay": 0},
                    "Params": {type: "enlarge", value: "对图片进行放大"}
                }],
                "HotspotID": "AlertPicEnlarge", //图片的放大按钮
                "Name": "",
                "Type": "Image",
                "Attributes": {
                    "ImageNormal": setting["hotPicEnlargeBackgroundImageNormal"],
                    "ImageOver": setting["hotPicEnlargeBackgroundImageOver"]
                },
                "Positions": [{
                    "Alpha": 1,
                    "Pan": position.pan,
                    "Tilt": 0,
                    "Rx": 0,
                    "Ry": 0,
                    "Rz": 0,
                    "Tx": setting["hotPicEnlargeTranslateX"],
                    "Ty": setting["hotPicEnlargeTranslateY"],
                    "Sx": 1,
                    "Sy": 1,
                    "Width": setting["hotPicEnlargeWidth"],
                    "Height": setting["hotPicEnlargeHeight"]
                }],
                modelType: "alert", //设置绘制的图形的类别
                typeName: {
                    name: "hot-pic",
                    type: "picScale"
                }
            },
            {
                "Actions": [{
                    "Name": "action_hot_changePlane",
                    "Triggers": {"Type": "mouse_hover", "Delay": 0},
                    "Params": {type: "narrow", value: "对图片进行缩小"}
                }],
                "HotspotID": "AlertPicNarrow", //图片的放大按钮
                "Name": "",
                "Type": "Image",
                "Attributes": {
                    "ImageNormal": setting["hotPicNarrowBackgroundImageNormal"],
                    "ImageOver": setting["hotPicNarrowBackgroundImageOver"]
                },
                "Positions": [{
                    "Alpha": 1,
                    "Pan": position.pan,
                    "Tilt": 0,
                    "Rx": 0,
                    "Ry": 0,
                    "Rz": 0,
                    "Tx": setting["hotPicNarrowTranslateX"],
                    "Ty": setting["hotPicNarrowTranslateY"],
                    "Sx": 1,
                    "Sy": 1,
                    "Width": setting["hotPicNarrowWidth"],
                    "Height": setting["hotPicNarrowHeight"]
                }],
                modelType: "alert", //设置绘制的图形的类别
                typeName: {
                    name: "hot-pic",
                    type: "picScale"
                }
            },
            {
                "Actions": [{
                    "Name": "action_hot_changePlane",
                    "Triggers": {"Type": "mouse_hover", "Delay": 0},
                    "Params": {type: "left", value: "图片向左移动"}
                }],
                "HotspotID": "AlertPicLeft", //图片向左移动按钮
                "Name": "",
                "Type": "Image",
                "Attributes": {
                    "ImageNormal": setting["hotPicLeftBackgroundImageNormal"],
                    "ImageOver": setting["hotPicLeftBackgroundImageOver"]
                },
                "Positions": [{
                    "Alpha": 1,
                    "Pan": position.pan,
                    "Tilt": 0,
                    "Rx": 0,
                    "Ry": 0,
                    "Rz": 0,
                    "Tx": setting["hotPicLeftTranslateX"],
                    "Ty": setting["hotPicLeftTranslateY"],
                    "Sx": 1,
                    "Sy": 1,
                    "Width": setting["hotPicLeftWidth"],
                    "Height": setting["hotPicLeftHeight"]
                }],
                modelType: "alert", //设置绘制的图形的类别
                typeName: {
                    name: "hot-pic",
                    type: "changePosition"
                }
            },
            {
                "Actions": [{
                    "Name": "action_hot_changePlane",
                    "Triggers": {"Type": "mouse_hover", "Delay": 0},
                    "Params": {type: "up", value: "图片向上移动"}
                }],
                "HotspotID": "AlertPicUp", //图片向上移动的按钮
                "Name": "",
                "Type": "Image",
                "Attributes": {
                    "ImageNormal": setting["hotPicUpBackgroundImageNormal"],
                    "ImageOver": setting["hotPicUpBackgroundImageOver"]
                },
                "Positions": [{
                    "Alpha": 1,
                    "Pan": position.pan,
                    "Tilt": 0,
                    "Rx": 0,
                    "Ry": 0,
                    "Rz": 0,
                    "Tx": setting["hotPicUpTranslateX"],
                    "Ty": setting["hotPicUpTranslateY"],
                    "Sx": 1,
                    "Sy": 1,
                    "Width": setting["hotPicUpWidth"],
                    "Height": setting["hotPicUpHeight"]
                }],
                modelType: "alert", //设置绘制的图形的类别
                typeName: {
                    name: "hot-pic",
                    type: "changePosition"
                }
            },
            {
                "Actions": [{
                    "Name": "action_hot_changePlane",
                    "Triggers": {"Type": "mouse_hover", "Delay": 0},
                    "Params": {type: "right", value: "图片向右移动"}
                }],
                "HotspotID": "AlertPicRight", //图片向右移动的按钮
                "Name": "",
                "Type": "Image",
                "Attributes": {
                    "ImageNormal": setting["hotPicRightBackgroundImageNormal"],
                    "ImageOver": setting["hotPicRightBackgroundImageOver"]
                },
                "Positions": [{
                    "Alpha": 1,
                    "Pan": position.pan,
                    "Tilt": 0,
                    "Rx": 0,
                    "Ry": 0,
                    "Rz": 0,
                    "Tx": setting["hotPicRightTranslateX"],
                    "Ty": setting["hotPicRightTranslateY"],
                    "Sx": 1,
                    "Sy": 1,
                    "Width": setting["hotPicRightWidth"],
                    "Height": setting["hotPicRightHeight"]
                }],
                modelType: "alert", //设置绘制的图形的类别
                typeName: {
                    name: "hot-pic",
                    type: "changePosition"
                }
            },
            {
                "Actions": [{
                    "Name": "action_hot_changePlane",
                    "Triggers": {"Type": "mouse_hover", "Delay": 0},
                    "Params": {type: "down", value: "图片向下移动"}
                }],
                "HotspotID": "AlertPicDown", //图片向下移动的按钮
                "Name": "",
                "Type": "Image",
                "Attributes": {
                    "ImageNormal": setting["hotPicDownBackgroundImageNormal"],
                    "ImageOver": setting["hotPicDownBackgroundImageOver"]
                },
                "Positions": [{
                    "Alpha": 1,
                    "Pan": position.pan,
                    "Tilt": 0,
                    "Rx": 0,
                    "Ry": 0,
                    "Rz": 0,
                    "Tx": setting["hotPicDownTranslateX"],
                    "Ty": setting["hotPicDownTranslateY"],
                    "Sx": 1,
                    "Sy": 1,
                    "Width": setting["hotPicDownWidth"],
                    "Height": setting["hotPicDownHeight"]
                }],
                modelType: "alert", //设置绘制的图形的类别
                typeName: {
                    name: "hot-pic",
                    type: "changePosition"
                }
            },
            {
                "Actions": [{
                    "Name": "action_hot_changePlane",
                    "Triggers": {"Type": "mouse_hover", "Delay": 0},
                    "Params": {type: "leftUp", value: "图片向左上移动"}
                }],
                "HotspotID": "AlertPicLeftUp", //图片向左移动按钮
                "Name": "",
                "Type": "Image",
                "Attributes": {
                    "ImageNormal": setting["hotPicLeftUpBackgroundImageNormal"],
                    "ImageOver": setting["hotPicLeftUpBackgroundImageOver"]
                },
                "Positions": [{
                    "Alpha": 1,
                    "Pan": position.pan,
                    "Tilt": 0,
                    "Rx": 0,
                    "Ry": 0,
                    "Rz": 0,
                    "Tx": setting["hotPicLeftUpTranslateX"],
                    "Ty": setting["hotPicLeftUpTranslateY"],
                    "Sx": 1,
                    "Sy": 1,
                    "Width": setting["hotPicLeftUpWidth"],
                    "Height": setting["hotPicLeftUpHeight"]
                }],
                modelType: "alert", //设置绘制的图形的类别
                typeName: {
                    name: "hot-pic",
                    type: "changePosition"
                }
            },
            {
                "Actions": [{
                    "Name": "action_hot_changePlane",
                    "Triggers": {"Type": "mouse_hover", "Delay": 0},
                    "Params": {type: "leftDown", value: "图片向左下移动"}
                }],
                "HotspotID": "AlertPicLeftDown", //图片向左下移动的按钮
                "Name": "",
                "Type": "Image",
                "Attributes": {
                    "ImageNormal": setting["hotPicLeftDownBackgroundImageNormal"],
                    "ImageOver": setting["hotPicLeftDownBackgroundImageOver"]
                },
                "Positions": [{
                    "Alpha": 1,
                    "Pan": position.pan,
                    "Tilt": 0,
                    "Rx": 0,
                    "Ry": 0,
                    "Rz": 0,
                    "Tx": setting["hotPicLeftDownTranslateX"],
                    "Ty": setting["hotPicLeftDownTranslateY"],
                    "Sx": 1,
                    "Sy": 1,
                    "Width": setting["hotPicLeftDownWidth"],
                    "Height": setting["hotPicLeftDownHeight"]
                }],
                modelType: "alert", //设置绘制的图形的类别
                typeName: {
                    name: "hot-pic",
                    type: "changePosition"
                }
            },
            {
                "Actions": [{
                    "Name": "action_hot_changePlane",
                    "Triggers": {"Type": "mouse_hover", "Delay": 0},
                    "Params": {type: "rightUp", value: "图片向右上移动"}
                }],
                "HotspotID": "AlertPicRightUp", //图片向右上移动的按钮
                "Name": "",
                "Type": "Image",
                "Attributes": {
                    "ImageNormal": setting["hotPicRightUpBackgroundImageNormal"],
                    "ImageOver": setting["hotPicRightUpBackgroundImageOver"]
                },
                "Positions": [{
                    "Alpha": 1,
                    "Pan": position.pan,
                    "Tilt": 0,
                    "Rx": 0,
                    "Ry": 0,
                    "Rz": 0,
                    "Tx": setting["hotPicRightUpTranslateX"],
                    "Ty": setting["hotPicRightUpTranslateY"],
                    "Sx": 1,
                    "Sy": 1,
                    "Width": setting["hotPicRightUpWidth"],
                    "Height": setting["hotPicRightUpHeight"]
                }],
                modelType: "alert", //设置绘制的图形的类别
                typeName: {
                    name: "hot-pic",
                    type: "changePosition"
                }
            },
            {
                "Actions": [{
                    "Name": "action_hot_changePlane",
                    "Triggers": {"Type": "mouse_hover", "Delay": 0},
                    "Params": {type: "rightDown", value: "图片向右下移动"}
                }],
                "HotspotID": "AlertPicRightDown", //图片向右下移动的按钮
                "Name": "",
                "Type": "Image",
                "Attributes": {
                    "ImageNormal": setting["hotPicRightDownBackgroundImageNormal"],
                    "ImageOver": setting["hotPicRightDownBackgroundImageOver"]
                },
                "Positions": [{
                    "Alpha": 1,
                    "Pan": position.pan,
                    "Tilt": 0,
                    "Rx": 0,
                    "Ry": 0,
                    "Rz": 0,
                    "Tx": setting["hotPicRightDownTranslateX"],
                    "Ty": setting["hotPicRightDownTranslateY"],
                    "Sx": 1,
                    "Sy": 1,
                    "Width": setting["hotPicRightDownWidth"],
                    "Height": setting["hotPicRightDownHeight"]
                }],
                modelType: "alert", //设置绘制的图形的类别
                typeName: {
                    name: "hot-pic",
                    type: "changePosition"
                }
            }
        ];

        //如果平面地图大于两个才显示切换按钮
        if (selfObj.sceneMap.length >= 2) {
            var prev = selfObj.prev = new that.CreateTitle({
                text: selfObj.sceneMap[selfObj.sceneMap.length - 1].name,
                width: setting["hotPicPrevWidth"],
                height: setting["hotPicPrevHeight"]
            });
            prev.init();

            var next = selfObj.next = new that.CreateTitle({
                text: selfObj.sceneMap[1].name,
                width: setting["hotPicNextWidth"],
                height: setting["hotPicNextHeight"]
            });
            next.init();

            arr = arr.concat([
                {
                    "Actions": [{
                        "Name": "action_hot_changePlane",
                        "Triggers": {"Type": "mouse_click", "Delay": 0},
                        "Params": {type: "prev", value: "切换左边一张图片"}
                    }],
                    "HotspotID": "AlertPicPrev", //图片向左切换的按钮
                    "Name": "",
                    "Type": "Image",
                    "Attributes": {},
                    Canvas: {
                        CanvasNormal: prev.getCanvas(),
                        CanvasOver: prev.getCanvas()
                    },
                    "Positions": [{
                        "Alpha": 1,
                        "Pan": position.pan,
                        "Tilt": 0,
                        "Rx": 0,
                        "Ry": 0,
                        "Rz": 0,
                        "Tx": setting["hotPicPrevTranslateX"],
                        "Ty": setting["hotPicPrevTranslateY"],
                        "Sx": 1,
                        "Sy": 1,
                        "Width": setting["hotPicPrevWidth"],
                        "Height": setting["hotPicPrevHeight"]
                    }],
                    modelType: "alert", //设置绘制的图形的类别
                    typeName: {
                        name: "hot-pic",
                        type: "changePlane",
                        canvas: prev //图标实例化对象
                    }
                },
                {
                    "Actions": [{
                        "Name": "action_hot_changePlane",
                        "Triggers": {"Type": "mouse_click", "Delay": 0},
                        "Params": {type: "next", value: "切换右边一张图片"}
                    }],
                    "HotspotID": "AlertPicNext", //切换右边一张图片按钮
                    "Name": "",
                    "Type": "Image",
                    "Attributes": {},
                    Canvas: {
                        CanvasNormal: next.getCanvas(),
                        CanvasOver: next.getCanvas()
                    },
                    "Positions": [{
                        "Alpha": 1,
                        "Pan": position.pan,
                        "Tilt": 0,
                        "Rx": 0,
                        "Ry": 0,
                        "Rz": 0,
                        "Tx": setting["hotPicNextTranslateX"],
                        "Ty": setting["hotPicNextTranslateY"],
                        "Sx": 1,
                        "Sy": 1,
                        "Width": setting["hotPicNextWidth"],
                        "Height": setting["hotPicNextHeight"]
                    }],
                    modelType: "alert", //设置绘制的图形的类别
                    typeName: {
                        name: "hot-pic",
                        type: "changePlane",
                        canvas: next //图标实例化对象
                    }
                }
            ]);
        }

        for (var i = 0, len = arr.length; i < len; i++) {
            var obj = that.createHost(arr[i], false);
            //添加上modelType
            obj.modelType = arr[i].modelType;
            obj.typeName = arr[i].typeName;
            if (obj.typeName.type !== "changePosition") {
                obj.isShow = true;//是否显示
            }
            obj.position = arr[i].Positions[0];
            that.hotSpotList[arr[i].HotspotID] = obj;
        }

        //将当前显示的图片的坐标存储下来
        selfObj.index = 0;
    },
    //平面地图修改图片相关的事件
    action_hot_changePlane: function (data) {
        var that = this;
        var selfObj = that.action_hot_plane;
        var canvas = selfObj.canvas;

        switch (data.type) {
            case "prev":
                selfObj.index--;
                if (selfObj.index < 0) {
                    selfObj.index = selfObj.sceneMap.length - 1;
                }

                canvas.changeImage(selfObj.sceneMap[selfObj.index].src);
                changeText();
                break;
            case "next":
                selfObj.index++;
                if (selfObj.index >= selfObj.sceneMap.length) {
                    selfObj.index = 0;
                }
                canvas.changeImage(selfObj.sceneMap[selfObj.index].src);
                changeText(selfObj.sceneMap[selfObj.index].name);
                break;
            case "left":
                canvas.left();
                break;
            case "up":
                canvas.up();
                break;
            case "right":
                canvas.right();
                break;
            case "down":
                canvas.down();
                break;
            case "leftUp":
                canvas.leftUp();
                break;
            case "leftDown":
                canvas.leftDown();
                break;
            case "rightUp":
                canvas.rightUp();
                break;
            case "rightDown":
                canvas.rightDown();
                break;
            case "enlarge":
                canvas.enlarge();
                break;
            case "narrow":
                canvas.narrow();
                break;
            default:
                return null;
        }


        function changeText() {
            if (selfObj.index - 1 < 0) {
                selfObj.prev.changeText(selfObj.sceneMap[selfObj.sceneMap.length - 1].name);
            }
            else {
                selfObj.prev.changeText(selfObj.sceneMap[selfObj.index - 1].name);
            }
            if (selfObj.index + 1 >= selfObj.sceneMap.length) {
                selfObj.next.changeText(selfObj.sceneMap[0].name);
            }
            else {
                selfObj.next.changeText(selfObj.sceneMap[selfObj.index + 1].name);
            }
        }

        //通过index重新渲染纹理
        //console.log(that.hotSpotList["AlertContentPic"]);
        /*that.loadImageTexture(that.action_hot_pic.value[that.action_hot_pic.index].src, function (e) {
         this.imageNorObj = e;
         this.imageSelObj = e;
         }.bind(that.hotSpotList["AlertContentPic"]));*/
    },
    //*------------------------------------------------------文字热点事件------------------------------------------
    action_hot_text: function (data) {
        let setting = this.toolSetting.hotText;
        let that = this;

        //获取当前vr焦点的ptf
        let position = this.getPTF();

        //初始化弹框
        this._Alert_init();

        //实例化获取canvas对象
        that.action_hot_text.canvas = new this.action_hot_textToImg({
            canvasWidth: setting["hotTextContentWrapWidth"], //canvas的宽度
            canvasMinHeight: setting["hotTextContentWrapHeight"], //canvas的最小高度,如果不需要可以设置为0
            drawStartX: setting["hotTextDrawStartX"], //绘制字符串起始x坐标
            drawStartY: setting["hotTextDrawStartY"], //绘制字符串起始y坐标
            lineHeight: setting["hotTextLineHeight"], //文字的行高
            font: setting["hotTextFont"], //文字样式
            text: data.text, //需要绘制的文本
            drawWidth: setting["hotTextDrawWidth"], //文字显示的宽度
            color: setting["hotTextColor"], //文字的颜色
            backgroundColor: setting["hotTextBackgroundColor"], //背景颜色
            moveStep: setting["hotTextMoveStep"] //每次移动移动的距离
        });

        let arr = [
            {
                "HotspotID": "AlertContentText", //图片显示区域的背景
                "Name": "",
                "Type": "Image",
                "Attributes": {},
                Canvas: {
                    CanvasNormal: that.action_hot_text.canvas.getCanvas(),
                    CanvasOver: that.action_hot_text.canvas.getCanvas()
                },
                "Positions": [{
                    "Alpha": 1,
                    "Pan": position.pan,
                    "Tilt": 0,
                    "Rx": 0,
                    "Ry": 0,
                    "Rz": 0,
                    "Tx": 0,
                    "Ty": setting["hotTextContentWrapTranslateY"],
                    "Sx": 1,
                    "Sy": 1,
                    "Width": setting["hotTextContentWrapWidth"],
                    "Height": setting["hotTextContentWrapHeight"]
                }],
                modelType: "alert", //设置绘制的图形的类别
                typeName: {
                    name: "hot-text"
                }
            },
            {
                "Actions": [{
                    "Name": "action_hot_changeText",
                    "Triggers": {"Type": "mouse_hover", "Delay": 0},
                    "Params": {type: "up", value: "镜头窗口向上移动"}
                }],
                "HotspotID": "AlertTextUp", //图片向上移动的按钮
                "Name": "",
                "Type": "Image",
                "Attributes": {
                    "ImageNormal": setting["hotTextUpBackgroundImageNormal"],
                    "ImageOver": setting["hotTextUpBackgroundImageOver"]
                },
                "Positions": [{
                    "Alpha": 1,
                    "Pan": position.pan,
                    "Tilt": 0,
                    "Rx": 0,
                    "Ry": 0,
                    "Rz": 0,
                    "Tx": setting["hotTextUpTranslateX"],
                    "Ty": setting["hotTextUpTranslateY"],
                    "Sx": 1,
                    "Sy": 1,
                    "Width": setting["hotTextUpWidth"],
                    "Height": setting["hotTextUpHeight"]
                }],
                modelType: "alert", //设置绘制的图形的类别
                typeName: {
                    name: "hot-text",
                    type: "control"
                }
            },
            {
                "Actions": [{
                    "Name": "action_hot_changeText",
                    "Triggers": {"Type": "mouse_hover", "Delay": 0},
                    "Params": {type: "down", value: "镜头窗口向下移动"}
                }],
                "HotspotID": "AlertTextDown", //图片向下移动的按钮
                "Name": "",
                "Type": "Image",
                "Attributes": {
                    "ImageNormal": setting["hotTextDownBackgroundImageNormal"],
                    "ImageOver": setting["hotTextDownBackgroundImageOver"]
                },
                "Positions": [{
                    "Alpha": 1,
                    "Pan": position.pan,
                    "Tilt": 0,
                    "Rx": 0,
                    "Ry": 0,
                    "Rz": 0,
                    "Tx": setting["hotTextDownTranslateX"],
                    "Ty": setting["hotTextDownTranslateY"],
                    "Sx": 1,
                    "Sy": 1,
                    "Width": setting["hotTextDownWidth"],
                    "Height": setting["hotTextDownHeight"]
                }],
                modelType: "alert", //设置绘制的图形的类别
                typeName: {
                    name: "hot-text",
                    type: "control"
                }
            }
        ];

        for (let i = 0, len = arr.length; i < len; i++) {
            let obj = that.createHost(arr[i], false);
            //添加上modelType
            obj.typeName = arr[i].typeName;
            obj.modelType = arr[i].modelType;
            //判断是否需要显示
            if (!that.action_hot_text.canvas.canMove && arr[i].typeName.type === "control") {
                obj.isShow = false;
            }
            else {
                obj.isShow = true;//是否显示
            }
            obj.position = arr[i].Positions[0];
            that.hotSpotList[arr[i].HotspotID] = obj;
        }

    },
    //上下移动文字事件
    action_hot_changeText: function (value) {
        var that = this;
        if (value.type === "up") {
            that.action_hot_text.canvas.up();
        }
        else if (value.type === "down") {
            that.action_hot_text.canvas.down();
        }
    },
    //*------------------------------------------------------模型热点事件------------------------------------------
    action_hot_model: function (data) {
        let setting = this.toolSetting.hotModel;
        let that = this;

        //获取当前vr焦点的ptf
        let position = this.getPTF();

        //初始化弹框
        this._Alert_init();

        //实例化显示的canvas对象
        let pics = data.model;
        that.action_hot_model.canvas = this._canvasDrawPic({
            imgPath: pics[0].src,
            canvasWidth: setting["hotModelContentWrapWidth"],
            canvasHeight: setting["hotModelContentWrapHeight"]
        });

        //增加的弹框内容
        let arr = [
            {
                "HotspotID": "AlertContentWrap", //图片显示区域的背景
                "Name": "",
                "Type": "Image",
                "Attributes": {
                    "ImageNormal": setting["hotModelContentWrapBackgroundImageNormal"],
                    "ImageOver": setting["hotModelContentWrapBackgroundImageOver"]
                },
                "Positions": [{
                    "Alpha": 1,
                    "Pan": position.pan,
                    "Tilt": 0,
                    "Rx": 0,
                    "Ry": 0,
                    "Rz": 0,
                    "Tx": 0,
                    "Ty": setting["hotModelContentWrapTranslateY"],
                    "Sx": 1,
                    "Sy": 1,
                    "Width": setting["hotModelContentWrapWidth"],
                    "Height": setting["hotModelContentWrapHeight"]
                }],
                modelType: "alert" //设置绘制的图形的类别
            },
            {
                "HotspotID": "AlertContentModel", //图片显示区域的背景
                "Name": "",
                "Type": "Image",
                "Attributes": {},
                Canvas: {
                    CanvasNormal: that.action_hot_model.canvas.getCanvas(),
                    CanvasOver: that.action_hot_model.canvas.getCanvas()
                },
                "Positions": [{
                    "Alpha": 1,
                    "Pan": position.pan,
                    "Tilt": 0,
                    "Rx": 0,
                    "Ry": 0,
                    "Rz": 0,
                    "Tx": 0,
                    "Ty": setting["hotModelContentWrapTranslateY"],
                    "Sx": 1,
                    "Sy": 1,
                    "Width": setting["hotModelContentWrapWidth"],
                    "Height": setting["hotModelContentWrapHeight"]
                }],
                modelType: "alert" //设置绘制的图形的类别
            },
            {
                "Actions": [{
                    "Name": "action_hot_changeModel",
                    "Triggers": {"Type": "mouse_click", "Delay": setting["hotModelChangeDelay"]},
                    "Params": {type: "levoclination", value: "模型向左旋转的效果"}
                }],
                "HotspotID": "AlertModelLevoclination", //模型向左旋转的效果
                "Name": "",
                "Type": "Image",
                "Attributes": {
                    "ImageNormal": setting["hotModelLevoclinationBackgroundImageNormal"],
                    "ImageOver": setting["hotModelLevoclinationBackgroundImageOver"]
                },
                "Positions": [{
                    "Alpha": .03,
                    "Pan": position.pan,
                    "Tilt": 0,
                    "Rx": 0,
                    "Ry": 0,
                    "Rz": 0,
                    "Tx": setting["hotModelLevoclinationTranslateX"],
                    "Ty": setting["hotModelLevoclinationTranslateY"],
                    "Sx": 1,
                    "Sy": 1,
                    "Width": setting["hotModelLevoclinationWidth"],
                    "Height": setting["hotModelLevoclinationHeight"]
                }],
                modelType: "alert" //设置绘制的图形的类别
            },
            {
                "Actions": [{
                    "Name": "action_hot_changeModel",
                    "Triggers": {"Type": "mouse_click", "Delay": setting["hotModelChangeDelay"]},
                    "Params": {type: "dextrorotation", value: "模型向右旋转的效果"}
                }],
                "HotspotID": "AlertModelDextrorotation", //模型向右旋转的效果
                "Name": "",
                "Type": "Image",
                "Attributes": {
                    "ImageNormal": setting["hotModelDextrorotationBackgroundImageNormal"],
                    "ImageOver": setting["hotModelDextrorotationBackgroundImageOver"]
                },
                "Positions": [{
                    "Alpha": .03,
                    "Pan": position.pan,
                    "Tilt": 0,
                    "Rx": 0,
                    "Ry": 0,
                    "Rz": 0,
                    "Tx": setting["hotModelDextrorotationTranslateX"],
                    "Ty": setting["hotModelDextrorotationTranslateY"],
                    "Sx": 1,
                    "Sy": 1,
                    "Width": setting["hotModelDextrorotationWidth"],
                    "Height": setting["hotModelDextrorotationHeight"]
                }],
                modelType: "alert" //设置绘制的图形的类别
            }
        ];

        for (let i = 0, len = arr.length; i < len; i++) {
            var obj = that.createHost(arr[i], false);
            //添加上modelType
            obj.modelType = arr[i].modelType;
            obj.isShow = true;
            obj.typeName = {
                name: "hot-model"
            };
            obj.position = arr[i].Positions[0];
            that.hotSpotList[arr[i].HotspotID] = obj;
        }

        //将当前显示的图片的坐标存储下来
        that.action_hot_model.index = 0;

        that.action_hot_model.len = data.model.length;
        that.action_hot_model.value = data.model;

        //console.log(that.hotSpotList);
    },
    //模型的切换事件
    action_hot_changeModel: function (data) {
        var that = this;
        var canvas = that.action_hot_model.canvas;
        if (data.type === "levoclination") {
            that.action_hot_model.index--;
            if (that.action_hot_model.index < 0) {
                that.action_hot_model.index = that.action_hot_model.len - 1;
            }

            canvas.changeImage(that.action_hot_model.value[that.action_hot_model.index].src);
        }
        else if (data.type === "dextrorotation") {

            that.action_hot_model.index++;
            if (that.action_hot_model.index >= that.action_hot_model.len) {
                that.action_hot_model.index = 0;
            }
            canvas.changeImage(that.action_hot_model.value[that.action_hot_model.index].src);
        }
    },
    //*------------------------------------------------------视频热点事件------------------------------------------
    action_hot_video: function (data) {
        var setting = this.toolSetting.hotVideo;
        var videoSettings = this.toolSetting.canvasVideoSettings;
        var that = this;

        //获取当前vr焦点的ptf
        var position = this.getPTF();

        //初始化弹框
        this._Alert_init();

        //播放按钮的切换操作
        var playCanvas = that.action_hot_video.playCanvas = that._canvasDrawPic({
            imgPath: setting["playBackgroundImageNormal"],
            imgWidth: setting["playWidth"],
            imgHeight: setting["playHeight"],
            isFull: true
        });

        //生成需要设置的配置项
        var options = {};
        for (var i in videoSettings) {
            options[i] = videoSettings[i];
        }
        options.videoSrc = data.src;

        options.playPic = setting["playBackgroundImageNormal"]; //播放按钮图片
        options.pausePic = setting["pauseBackgroundImageNormal"]; //暂停按钮图片
        options.playCanvas = playCanvas; //播放按钮切换对象

        //实例化video操作的对象
        var canvas = that.action_hot_video.canvas = new that._canvasDrawVideo(options);
        canvas.init();


        var arr = [
            {
                "HotspotID": "AlertContentVideo", //图片显示区域的背景
                "Name": "",
                "Type": "Image",
                "Attributes": {},
                Canvas: {
                    CanvasNormal: canvas.getCanvas(),
                    CanvasOver: canvas.getCanvas()
                },
                "Positions": [{
                    "Alpha": 1,
                    "Pan": position.pan,
                    "Tilt": 0,
                    "Rx": 0,
                    "Ry": 0,
                    "Rz": 0,
                    "Tx": 0,
                    "Ty": setting["videoContentWrapTranslateY"],
                    "Sx": 1,
                    "Sy": 1,
                    "Width": setting["videoContentWrapWidth"],
                    "Height": setting["videoContentWrapHeight"]
                }],
                modelType: "alert", //设置绘制的图形的类别
                typeName: {
                    name: "hot-video",
                    type: "video-back"
                }
            },
            {
                "Actions": [{
                    "Name": "action_hot_changeVideo",
                    "Triggers": {"Type": "mouse_hover", "Delay": 0},
                    "Params": {type: "volumeDown", value: "音量减小键"}
                }],
                "HotspotID": "videoVolumeDown", //图片向上移动的按钮
                "Name": "",
                "Type": "Image",
                "Attributes": {
                    "ImageNormal": setting["volumeDownBackgroundImageNormal"],
                    "ImageOver": setting["volumeDownBackgroundImageOver"]
                },
                "Positions": [{
                    "Alpha": 1,
                    "Pan": position.pan,
                    "Tilt": 0,
                    "Rx": 0,
                    "Ry": 0,
                    "Rz": 0,
                    "Tx": setting["volumeDownTranslateX"],
                    "Ty": setting["volumeDownTranslateY"],
                    "Sx": 1,
                    "Sy": 1,
                    "Width": setting["volumeDownWidth"],
                    "Height": setting["volumeDownHeight"]
                }],
                modelType: "alert", //设置绘制的图形的类别
                typeName: {
                    name: "hot-video",
                    type: "video-option" //视频弹框功能键
                }
            },
            {
                "Actions": [
                    {
                        "Name": "action_hot_changeVideo",
                        "Triggers": {"Type": "mouse_hover", "Delay": 0},
                        "Params": {type: "backward", value: "快退按钮"}
                    },
                    {
                        "Name": "action_hot_changeVideo",
                        "Triggers": {"Type": "mouse_leave", "Delay": 0}, //离开模型触发修改事件
                        "Params": {type: "saveProgress", value: "快退按钮"}
                    }
                ],
                "HotspotID": "videoBackward",
                "Name": "",
                "Type": "Image",
                "Attributes": {
                    "ImageNormal": setting["backwardBackgroundImageNormal"],
                    "ImageOver": setting["backwardBackgroundImageOver"]
                },
                "Positions": [{
                    "Alpha": 1,
                    "Pan": position.pan,
                    "Tilt": 0,
                    "Rx": 0,
                    "Ry": 0,
                    "Rz": 0,
                    "Tx": setting["backwardTranslateX"],
                    "Ty": setting["backwardTranslateY"],
                    "Sx": 1,
                    "Sy": 1,
                    "Width": setting["backwardWidth"],
                    "Height": setting["backwardHeight"]
                }],
                modelType: "alert", //设置绘制的图形的类别
                typeName: {
                    name: "hot-video",
                    type: "video-option" //视频弹框功能键
                }
            },
            {
                "Actions": [{
                    "Name": "action_hot_changeVideo",
                    "Triggers": {"Type": "mouse_click", "Delay": 0},
                    "Params": {type: "play", value: "播放暂停按钮"}
                }],
                "HotspotID": "videoPlay",
                "Name": "",
                "Type": "Image",
                "Attributes": {},
                Canvas: {
                    CanvasNormal: playCanvas.getCanvas(),
                    CanvasOver: playCanvas.getCanvas()
                },
                "Positions": [{
                    "Alpha": 1,
                    "Pan": position.pan,
                    "Tilt": 0,
                    "Rx": 0,
                    "Ry": 0,
                    "Rz": 0,
                    "Tx": setting["playTranslateX"],
                    "Ty": setting["playTranslateY"],
                    "Sx": 1,
                    "Sy": 1,
                    "Width": setting["playWidth"],
                    "Height": setting["playHeight"]
                }],
                modelType: "alert", //设置绘制的图形的类别
                typeName: {
                    name: "hot-video",
                    type: "video-option" //视频弹框功能键
                }
            },
            {
                "Actions": [
                    {
                        "Name": "action_hot_changeVideo",
                        "Triggers": {"Type": "mouse_hover", "Delay": 0},
                        "Params": {type: "forward", value: "快进按钮"}
                    },
                    {
                        "Name": "action_hot_changeVideo",
                        "Triggers": {"Type": "mouse_leave", "Delay": 0}, //离开模型触发修改事件
                        "Params": {type: "saveProgress", value: "快退按钮"}
                    }
                ],
                "HotspotID": "videoForward",
                "Name": "",
                "Type": "Image",
                "Attributes": {
                    "ImageNormal": setting["forwardBackgroundImageNormal"],
                    "ImageOver": setting["forwardBackgroundImageOver"]
                },
                "Positions": [{
                    "Alpha": 1,
                    "Pan": position.pan,
                    "Tilt": 0,
                    "Rx": 0,
                    "Ry": 0,
                    "Rz": 0,
                    "Tx": setting["forwardTranslateX"],
                    "Ty": setting["forwardTranslateY"],
                    "Sx": 1,
                    "Sy": 1,
                    "Width": setting["forwardWidth"],
                    "Height": setting["forwardHeight"]
                }],
                modelType: "alert", //设置绘制的图形的类别
                typeName: {
                    name: "hot-video",
                    type: "video-option" //视频弹框功能键
                }
            },
            {
                "Actions": [{
                    "Name": "action_hot_changeVideo",
                    "Triggers": {"Type": "mouse_hover", "Delay": 0},
                    "Params": {type: "volumeUp", value: "音量增加按钮"}
                }],
                "HotspotID": "videoVolumeUp",
                "Name": "",
                "Type": "Image",
                "Attributes": {
                    "ImageNormal": setting["volumeUpBackgroundImageNormal"],
                    "ImageOver": setting["volumeUpBackgroundImageOver"]
                },
                "Positions": [{
                    "Alpha": 1,
                    "Pan": position.pan,
                    "Tilt": 0,
                    "Rx": 0,
                    "Ry": 0,
                    "Rz": 0,
                    "Tx": setting["volumeUpTranslateX"],
                    "Ty": setting["volumeUpTranslateY"],
                    "Sx": 1,
                    "Sy": 1,
                    "Width": setting["volumeUpWidth"],
                    "Height": setting["volumeUpHeight"]
                }],
                modelType: "alert", //设置绘制的图形的类别
                typeName: {
                    name: "hot-video",
                    type: "video-option" //视频弹框功能键
                }
            }
        ];

        //添加到渲染队列
        for (var i = 0, len = arr.length; i < len; i++) {
            var obj = that.createHost(arr[i], false);
            //添加上modelType
            obj.modelType = arr[i].modelType;
            obj.typeName = arr[i].typeName;
            obj.isShow = true;//是否显示
            obj.position = arr[i].Positions[0];
            that.hotSpotList[arr[i].HotspotID] = obj;
        }


    },
    //视频热点的交互事件
    action_hot_changeVideo: function (data) {
        var that = this;
        var canvas = that.action_hot_video.canvas;
        switch (data.type) {
            case "volumeDown":
                //声音减少
                canvas.volumeDown();
                break;
            case "backward":
                //快退
                canvas.backward();
                break;
            case "play":
                //播放暂停
                canvas.changePlay();
                break;
            case "forward":
                //快进
                canvas.forward();
                break;
            case "volumeUp":
                //声音增加
                canvas.volumeUp();
                break;
            case "saveProgress":
                //保存当前进度
                canvas.saveProgress();
                break;
        }
    },
    //*------------------------------------------------------移门热点事件------------------------------------------

    //移门热点调用事件
    action_hot_slideDoor: function (data) {
        let that = this;
        let playerObj = that.playerObj;
        let slideDoor = that.toolSetting.slideDoor;
        let myExtend = that.myExtend;
        let panorama = that.panorama;
        let preview; //是否是预览浏览器
        if (panorama) {
            preview = panorama.settings.preview.type;
        }

        //禁止掉场景移动事件
        playerObj.api_setDragStatus(false);

        //判断上次点击的位置
        let nowTime = +new Date();
        /*if(nowTime - that.state.slideDoor.downTime < 250){
            //触发了双击事件
            //data.alert();

            //逻辑修改，不再触发双击事件
        }*/
        //将当前的数据保存到状态当中
        that.state.slideDoor.downTime = nowTime;
        that.state.slideDoor.clientX = data.event.clientX;
        that.state.slideDoor.clientY = data.event.clientY;

        let downX = data.event.clientX;//按下时距离窗口左边的距离
        let downY = data.event.clientY;//按下时距离窗口顶部的距离
        let x = 0; //当前旋转到的位置
        let step = (data.width * slideDoor.moveStep) / data.data.length;

        function move(event) {
            let moveX;
            //兼容性处理
            if (myExtend.browserRedirect() != "pc" && !preview) {
                moveX = event.changedTouches[0].clientX;
                x = Math.floor((moveX - downX) / step) + data.index;
            }
            else {
                moveX = event.clientX;
                x = Math.floor((moveX - downX) / step / 3) + data.index;
            }

            //判断是否可以循环拖拽
            if (data.cyclic) {
                //如果移门热点可以循环拖拽
                x = x % data.data.length;
                if (x < 0) {
                    x = data.data.length + x;
                }
            }
            else {
                //移门热点不可以循环拖拽
                if (x < 0) {
                    x = 0;
                }
                else if (x >= data.data.length) {
                    x = data.data.length - 1;
                }
            }

            //切换图片
            data.canvas.changeImage(data.data[x].src);
        }

        //移动端触发抬起事件
        function touchUp(e) {

            //设置当前的index为x
            data.index = x;
            //可以移动
            playerObj.api_setDragStatus(true);

            document.removeEventListener("touchmove", move, true);
            document.removeEventListener("touchend", touchUp, true);

            var upX = e.changedTouches[0].clientX;
            var upY = e.changedTouches[0].clientY;
            var upTime = +new Date();

            //判断是否是单击事件
            if (upTime - nowTime <= 250 && that.getRange(downX, downY, upX, upY) <= 20) {
                data.alert();
            }
        }

        //pc端触发的抬起事件
        function mouseUp(e) {

            //设置当前的index为x
            data.index = x;
            //可以移动
            playerObj.api_setDragStatus(true);

            document.removeEventListener("mousemove", move, true);
            document.removeEventListener("mouseup", mouseUp, true);

            var upX = e.clientX;
            var upY = e.clientY;
            var upTime = +new Date();

            //判断是否是单击事件
            if (upTime - nowTime <= 250 && that.getRange(downX, downY, upX, upY) <= 20) {
                data.alert();
            }
        }

        if (myExtend.browserRedirect() !== "pc" && !preview) {
            document.addEventListener("touchmove", move, true);
            document.addEventListener("touchend", touchUp, true);
        }
        else {
            document.addEventListener("mousemove", move, true);
            document.addEventListener("mouseup", mouseUp, true);
        }
    },
    //热点添加页面调用移门热点的事件
    action_move_slideDoor: function (data) {
        var that = this;
        var playerObj = that.playerObj;
        var myExtend = that.myExtend;
        var addHot = data.event.addHot; //从热点添加页面传入的数据
        var slideDoorHot = addHot.slideDoorHot; //移门热点的数组

        //禁止掉场景移动事件
        playerObj.api_setDragStatus(false);

        document.addEventListener("mousemove", move);
        document.addEventListener("touchmove", move, true);

        document.addEventListener("mouseup", up);
        document.addEventListener("touchend", up, true);

        var downX, downY;
        if (myExtend.browserRedirect() != "pc") {
            downX = event.changedTouches[0].clientX;//按下时距离窗口左边的距离
            downY = event.changedTouches[0].clientY;//按下时距离窗口顶部的距离
        }
        else {
            downX = data.event.clientX;//按下时距离窗口左边的距离
            downY = data.event.clientY;//按下时距离窗口顶部的距离
        }

        //获取到当前模型所在的位置
        var focusObj = null; //当前焦点的移门热点
        var x, y; //当前热点所在的xy轴
        for (var i = 0; i < slideDoorHot.length; i++) {
            if (slideDoorHot[i].id == data.id) {
                focusObj = slideDoorHot[i].params;
                //获取到当前对象的xy坐标
                var xy = playerObj.api_sphereToScreen(focusObj.pan, focusObj.tilt);
                x = xy.x;
                y = xy.y;
            }
        }

        function move(event) {
            var moveX, moveY;
            //兼容性处理
            if (myExtend.browserRedirect() != "pc") {
                moveX = event.changedTouches[0].clientX;
                moveY = event.changedTouches[0].clientY;
            }
            else {
                moveX = event.clientX;
                moveY = event.clientY;
            }

            var nowX = moveX - downX + x;
            var nowY = moveY - downY + y;

            var panTilt = playerObj.api_screenToSphere(nowX, nowY);
            //修改数组对象的相关信息
            focusObj.pan = panTilt.pan;
            focusObj.tilt = panTilt.tilt;

            //让移门对象进行移动
            var hotList = that.getAllDrawHot();
            hotList[data.id].position.Pan = panTilt.pan;
            hotList[data.id].position.Tilt = panTilt.tilt;

            //更新移门热点四个角的位置
            for (var i in hotList) {
                if (hotList[i].typeName.type == "slideDoor_focus" && hotList[i].typeName.id == data.id) {
                    hotList[i].position.Pan = panTilt.pan;
                    hotList[i].position.Tilt = panTilt.tilt;
                    /*var fivePx = hotList[i].position.width/1000; //每个点需要偏移的距离
                    switch (hotList[i].typeName.vertex){
                        case "v0":
                            hotList[i].position.Tx = hotObj.positionArr[j]/2-fivePx;
                            hotList[i].position.Ty = hotObj.positionArr[j+1]/2-fivePx;
                            break;
                        case "v1":
                            hotList[i].position.Tx = hotObj.positionArr[j]/2+fivePx;
                            hotList[i].position.Ty = hotObj.positionArr[j+1]/2-fivePx;
                            break;
                        case "v2:
                            hotList[i].position.Tx = hotObj.positionArr[j]/2-fivePx;
                            hotList[i].position.Ty = hotObj.positionArr[j+1]/2+fivePx;
                            break;
                        case "v3":
                            hotList[i].position.Tx = hotObj.positionArr[j]/2+fivePx;
                            hotList[i].position.Ty = hotObj.positionArr[j+1]/2+fivePx;
                            break;
                    }*/
                }
            }

            //addHot.slideDoor();
        }

        function up() {
            document.removeEventListener("mousemove", move);
            document.removeEventListener("mouseup", up);
            document.removeEventListener("touchmove", move, true);
            document.removeEventListener("touchend", up, true);
            //可以移动
            playerObj.api_setDragStatus(true);

            //焦点到移门热点上面
            addHot.changeFocus(data.id);

            //提示软件，更新相关热点的位置
            addHot.movePositionCallback(focusObj);
        }
    },
    //添加热点的焦点状态，热点添加页面使用
    action_focus_slideDoor: function (id) {
        //添加焦点状态显示四个可以拖拽的点，循环hotSpotList进行判断
        for (var i in this.hotSpotList) {
            if (this.hotSpotList[i].typeName.type == "slideDoor_focus" && this.hotSpotList[i].typeName.id == id) {
                this.hotSpotList[i].isShow = true;
            }
        }
    },
    //删除热点的焦点状态，热点添加页面使用>
    action_blur_slideDoor: function (id) {
        //将相关的四个可拖拽的点设置为不可显示状态
        for (var i in this.hotSpotList) {
            if (this.hotSpotList[i].typeName.type == "slideDoor_focus" && this.hotSpotList[i].typeName.id == id) {
                this.hotSpotList[i].isShow = false;
            }
        }
    },
    //变形移门热点的形状的方法
    action_change_slideDoor: function (data) {
        var that = this;
        var playerObj = that.playerObj;
        var myExtend = that.myExtend;
        var addHot = data.event.addHot; //从热点添加页面传入的数据
        var slideDoorHot = addHot.slideDoorHot; //移门热点的数组

        //禁止掉场景移动事件
        playerObj.api_setDragStatus(false);

        document.addEventListener("mousemove", move);
        document.addEventListener("touchmove", move, true);

        document.addEventListener("mouseup", up);
        document.addEventListener("touchend", up, true);

        var downX, downY;
        if (myExtend.browserRedirect() != "pc") {
            downX = event.changedTouches[0].clientX;//按下时距离窗口左边的距离
            downY = event.changedTouches[0].clientY;//按下时距离窗口顶部的距离
        }
        else {
            downX = data.event.clientX;//按下时距离窗口左边的距离
            downY = data.event.clientY;//按下时距离窗口顶部的距离
        }

        //获取到当前模型所在的位置
        var focusObj = null; //当前焦点的移门热点
        var focusButton = that.hotSpotList[data.id + "-" + data.vertex]; //当前拖拽的btn的渲染对象
        var flatObj = that.hotSlideList[data.id]; //播放器绘制的对象
        var pan, tilt; //当前热点所在的xy轴
        for (var i = 0; i < slideDoorHot.length; i++) {
            if (slideDoorHot[i].id == data.id) {
                focusObj = slideDoorHot[i].params;
                //获取到当前对象的xy坐标
                pan = focusObj.pan;
                tilt = focusObj.tilt;
            }
        }

        var plane = this.panTiltToPlane(pan, tilt);

        function move(event) {
            var moveX, moveY;
            //兼容性处理
            if (myExtend.browserRedirect() != "pc") {
                moveX = event.changedTouches[0].clientX;
                moveY = event.changedTouches[0].clientY;
            }
            else {
                moveX = event.clientX;
                moveY = event.clientY;
            }

            //todo:获取到当前鼠标所在的位置的pt值
            var worldPos = that.screenToWorld(moveX, moveY);

            //通过当前位置的世界坐标，生成一条三维线条，和plane求出在plane上面的坐标
            var line = new THREE.Line3(new THREE.Vector3, new THREE.Vector3(worldPos[0], worldPos[1], worldPos[2]).multiplyScalar(3));

            var target = plane.intersectLine(line, new THREE.Vector3);

            //根据逆矩阵求出当前场景的坐标
            var invert =mat4.create();
            mat4.invert(invert, flatObj.mMatrix);

            vec3.transformMat4(worldPos, target.toArray(), invert);

            //获取到当前拖拽的角
            var vNum = data.vertex;

            //设置移动按钮的位置
            focusButton.position.Tx = worldPos[0];
            focusButton.position.Ty = worldPos[1];

            //计算按钮距离中心的微小偏移
            var fivePx = 8 / 1000;
            //修改移门图形的每一个点的位置
            switch (vNum) {
                case "v0":
                    focusObj.positionArr[0] = worldPos[0] + fivePx;
                    focusObj.positionArr[1] = worldPos[1] + fivePx;
                    break;
                case "v1":
                    focusObj.positionArr[2] = worldPos[0] - fivePx;
                    focusObj.positionArr[3] = worldPos[1] + fivePx;
                    break;
                case "v2":
                    focusObj.positionArr[4] = worldPos[0] + fivePx;
                    focusObj.positionArr[5] = worldPos[1] - fivePx;
                    break;
                case "v3":
                    focusObj.positionArr[6] = worldPos[0] - fivePx;
                    focusObj.positionArr[7] = worldPos[1] - fivePx;
                    break;
            }

        }

        function up() {
            document.removeEventListener("mousemove", move);
            document.removeEventListener("mouseup", up);
            document.removeEventListener("touchmove", move, true);
            document.removeEventListener("touchend", up, true);
            //可以移动
            playerObj.api_setDragStatus(true);

            //焦点到移门热点上面
            addHot.changeFocus(data.id);

            //提示软件，更新相关热点的位置
            addHot.movePositionCallback(focusObj);
        }

        //获取实际偏移的函数
        function getCurrentTransition(pan, tilt) {
            return {tx: pan / 45 * 0.9, ty: tilt / 45 * 0.9};
        }
    },

    //*------------------------------------------------------区域选择事件------------------------------------------

    /*//鼠标按在区域选择触发的事件
    action_hot_area:function(data){
        this.changeAreaFocus(data.id, true);
    },

    //变形区域热点的修改单个点的位置方法
    action_change_area:function(data){
        console.log(data, '点击当前的单个操作点');
    },

    //修改区域选择点的显示隐藏
    changeAreaFocus(id, boolean){
        for (let i in this.hotSpotList) {
            if (this.hotSpotList[i].typeName.type == "slideDoor_focus" && this.hotSpotList[i].typeName.id == id) {
                this.hotSpotList[i].isShow = boolean;
            }
        }
    },*/

    //*------------------------------------------------------通用事件------------------------------------------

    //创建可以移动的标题
    CreateTitle: function (options) {
        function CanvasTitle(options) {
            this.settings = {
                canvas: document.createElement("canvas"), //显示的canvas
                width: 120, //显示的canvas宽度
                height: 40, //显示的canvas高度
                text: "这一段是", //显示的内容
                font: "20px 'Microsoft YaHei'", //字体样式
                color: "#ffffff", //字体颜色
                backgroundColor: "#000", //背景色
                img: new Image(), //生成img对象
                imgWidth: 0, //生成的img图片的宽度.
                textMoveStep: 0.5, //文字移动的速度
                startDrawImage: 0, //当前绘制canvas开始的位置
                canMove: false, //在图片生成之前无法移动
                shadowColor: 'rgba(0,0,0,0)', // 字体阴影的颜色
                shadowOffsetX: 0, //字体阴影沿x轴的偏移量
                shadowOffsetY: 0, //字体阴影沿y轴的偏移量
                shadowBlur: 0, //字体阴影的模糊度

            };

            //处理配置项
            for (var i in options) {
                this.settings[i] = options[i];
            }

            this.init = function () {
                this.createImg();
            };

            //绘制生成img对象
            this.createImg = function () {
                var that = this;
                that.onload = false;
                var settings = that.settings;
                var canvas = document.createElement("canvas");
                canvas.height = settings.height;
                var ctx = canvas.getContext("2d");
                ctx.font = settings.font;
                if (ctx.measureText(settings.text).width < settings.width) {
                    canvas.width = settings.width;
                }
                else {
                    canvas.width = ctx.measureText(settings.text).width;
                }
                //添加背景样式
                ctx.fillStyle = settings.backgroundColor;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                //添加阴影样式
                ctx.shadowColor = settings.shadowColor;
                ctx.shadowOffsetX = settings.shadowOffsetX;
                ctx.shadowOffsetY = settings.shadowOffsetY;
                ctx.shadowBlur = settings.shadowBlur;
                //添加字体样式
                ctx.font = settings.font;
                ctx.fillStyle = settings.color;
                ctx.textBaseline = "middle";
                if (canvas.width === Math.floor(settings.width)) {
                    ctx.textAlign = "center";
                    ctx.fillText(settings.text, settings.width / 2, settings.height / 2);
                }
                else {
                    ctx.fillText(settings.text, 0, settings.height / 2);
                }

                //创建img对象
                var img = settings.img;
                img.src = canvas.toDataURL();
                img.onload = function () {
                    settings.imgWidth = canvas.width;
                    that.drawToCanvas(img);
                    if (canvas.width > settings.width) {
                        settings.canMove = true;
                    }

                    //设置加载成功
                    that.onload = true;
                }
            };

            //绘制到canvas对象上面
            this.drawToCanvas = function () {
                var that = this;
                var settings = that.settings;
                var canvas = settings.canvas;
                canvas.width = settings.width;
                canvas.height = settings.height;
                var ctx = canvas.getContext("2d");
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(settings.img, 0, 0, canvas.width, canvas.height, 0, 0, canvas.width, canvas.height);
            };

            //切换文字方法
            this.changeText = function (text) {
                var that = this;
                var settings = that.settings;
                settings.text = text;
                that.createImg();
            };

            //canvas内的图片移动方法
            this.moveStep = function () {
                if (!this.onload) return;
                var that = this;
                var settings = that.settings;
                var ctx = settings.canvas.getContext("2d");
                if (!settings.canMove) return false;

                //清空canvas的内容
                ctx.clearRect(0, 0, settings.width, settings.height);

                settings.startDrawImage += settings.textMoveStep;
                if (settings.startDrawImage > settings.imgWidth) {
                    settings.startDrawImage = 0;
                }

                if (settings.startDrawImage > settings.imgWidth - settings.width) {
                    ctx.drawImage(settings.img, settings.startDrawImage, 0, settings.imgWidth - settings.startDrawImage, settings.height, 0, 0, settings.imgWidth - settings.startDrawImage, settings.height);
                }
                else {
                    ctx.drawImage(settings.img, settings.startDrawImage, 0, settings.width, settings.height, 0, 0, settings.width, settings.height);
                }

            };

            //获取canvas对象
            this.getCanvas = function () {
                return this.settings.canvas;
            }
        }

        return new CanvasTitle(options);
    },
    //文字生成图片
    action_hot_textToImg: function (options) {
        let that = this;
        that.canMove = true;

        let settings = {
            canvas: document.createElement("canvas"), //canvas对象，必填，不填写默认创建一个canvas
            canvasWidth: 580, //canvas的宽度
            canvasMinHeight: 360, //canvas的最小高度,如果不需要可以设置为0
            drawStartX: 10, //绘制字符串起始x坐标
            drawStartY: 24, //绘制字符串起始y坐标
            lineHeight: 30, //文字的行高
            font: "24px 'Microsoft Yahei'", //文字样式
            text: "请修改掉默认的配置", //需要绘制的文本
            drawWidth: 560, //文字显示的宽度
            color: "#000000", //文字的颜色
            backgroundColor: "#fff00f", //背景颜色
            moveStep: 30, //每次移动移动的距离
            canMove: true, //当前文字图片是否可以移动
        };

        //将传入的配置覆盖掉默认配置
        if (!!options && typeof options === "object") {
            for (var i in options) {
                settings[i] = options[i];
            }
        }

        //获取2d的上线文开始设置相关属性
        let canvas = settings.canvas;
        canvas.width = settings.canvasWidth;
        let ctx = canvas.getContext("2d");

        //绘制文字
        ctx.font = settings.font;
        ctx.fillStyle = settings.color;
        let lineWidth = 0; //当前行的绘制的宽度
        let lastTextIndex = 0; //已经绘制上canvas最后的一个字符的下标

        //由于改变canvas 的高度会导致绘制的纹理被清空，所以，不预先绘制，先放入到一个数组当中
        let arr = []; //将当前字符串以行的方式存储成一个数组
        for (let i = 0; i < settings.text.length; i++) {
            //获取当前的截取的字符串的宽度
            lineWidth = ctx.measureText(settings.text.substr(lastTextIndex, i - lastTextIndex)).width;

            //判断当前数组最后一组的宽度是否大于可绘制长度
            if (lineWidth >= settings.drawWidth) {
                //判断最后一位是否是标点符号
                if (judgePunctuationMarks(settings.text[i - 1])) {
                    //如果最后一位是符号，则再判断一下后一位合起来是否是"\n"
                    arr.push(settings.text.substr(lastTextIndex, i - lastTextIndex));
                    lastTextIndex = i;
                }
                else {
                    arr.push(settings.text.substr(lastTextIndex, i - lastTextIndex - 1));
                    lastTextIndex = i - 1;
                }
            }
            else if (settings.text[i - 1] === "\n") {
                //如果长度不到却匹配到了换行，则直接换行
                arr.push(settings.text.substr(lastTextIndex, i - lastTextIndex));
                lastTextIndex = i;
            }
            //将最后多余的一部分添加到数组
            if (i === settings.text.length - 1) {
                arr.push(settings.text.substr(lastTextIndex, i - lastTextIndex + 1));
            }
        }

        //根据arr的长度设置canvas的高度
        canvas.height = arr.length * settings.lineHeight;
        //判断是否达到最小高度
        if (canvas.height < settings.canvasMinHeight) {
            //重新设置起始位置
            settings.drawStartY += (settings.canvasMinHeight - canvas.height) / 2;
            canvas.height = settings.canvasMinHeight;
            //设置不可移动
            that.canMove = false;
        }

        //绘制背景色
        ctx.fillStyle = settings.backgroundColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        //设置字体颜色
        ctx.font = settings.font;
        ctx.fillStyle = settings.color;
        for (let i = 0; i < arr.length; i++) {
            ctx.fillText(arr[i], settings.drawStartX, settings.drawStartY + i * settings.lineHeight);
        }

        //判断是否是需要避开的标签符号 是符号返回true 不是符号返回false
        function judgePunctuationMarks(value) {
            var arr = [".", ",", ";", "?", "!", ":", "\"", "，", "。", "？", "！", "；", "：", "、"];
            for (var i = 0; i < arr.length; i++) {
                if (value === arr[i]) {
                    return true;
                }
            }
            return false;
        }

        //创建一个返回的img对象
        let image = new Image();
        image.src = canvas.toDataURL();

        //下面的内容生成canvas，
        that.canvas = document.createElement("canvas");
        that.canvas.width = settings.canvasWidth;
        that.canvas.height = settings.canvasMinHeight;

        that.ctx = that.canvas.getContext("2d");

        //第一次绘制
        image.onload = function () {
            that.ctx.drawImage(image, 0, 0, settings.canvasWidth, settings.canvasMinHeight, 0, 0, that.canvas.width, that.canvas.height);
        };

        //获取canvas对象的方法
        that.getCanvas = function () {
            return that.canvas;
        };

        that.move = 0; // 初始化canvas的位置

        //显示窗口向上移动按钮事件
        that.up = function () {
            that.move -= settings.moveStep;
            if (that.move < 0) {
                that.move = 0;
            }
            that.ctx.drawImage(image, 0, that.move, settings.canvasWidth, settings.canvasMinHeight, 0, 0, that.canvas.width, that.canvas.height);
        };

        //显示窗口向下移动按钮事件
        that.down = function () {
            that.move += settings.moveStep;
            if (that.move > image.height - settings.canvasMinHeight) {
                that.move = image.height - settings.canvasMinHeight;
            }
            that.ctx.drawImage(image, 0, that.move, settings.canvasWidth, settings.canvasMinHeight, 0, 0, that.canvas.width, that.canvas.height);
        }
    },
    //使用canvas绘制纹理的构造函数
    _canvasDrawPic: function (setting) {
        let that = this;
        let state = that.state;
        let DrawPic = function (inSetting) {
            let that = this;
            //配置项
            this.setting = {
                img: null, //图片对象
                imgPath: "10.jpg", // 图片地址路径
                imgWidth: 0, //图片的宽度
                imgHeight: 0, //图片的高度
                canvasWidth: 480, //canvas的宽度
                canvasHeight: 360, //canvas的高度
                currentImgWidth: 0, //实际绘制的宽度
                currentImgHeight: 0, //实际绘制的高度

                //动图的相关配置
                stepBool: false, //是否是动图png
                step: 0, //动图切换每一帧的宽度和高度
                stepIndex: 0, //当前帧的下标
                stepTime: 50, //每一帧切换的时间
                stepLen: 0, //动图的帧数

                //是否绘制全屏
                isFull: false,

                //缩放相关的一些属性
                scale: 1, //当前图片的缩放
                scrollScale: 1.01, //每次事件图片放大的倍数
                maxScale: 5, //图形可以放大的最大倍数
                fullDistance: "", //默认状态下百分百的是宽度还是高度 width or height

                //canvas渲染的一些相关属性
                sx: 0, //开始剪切的 x 坐标位置
                sy: 0, //开始剪切的 y 坐标位置
                swidth: 0, //被剪切图像的宽度
                sheight: 0, //被剪切图像的高度
                x: 0, //在画布上放置图像的 x 坐标位置
                y: 0, //在画布上放置图像的 y 坐标位置
                width: 0, //要使用的图像的宽度。（伸展或缩小图像）
                height: 0, //要使用的图像的高度。（伸展或缩小图像）

                //当前canvas中心点在图片中的点的位置的百分比
                canvasCenterXForImagePercent: 50, //中心x轴在图片的百分比
                canvasCenterYForImagePercent: 50, //中心点y轴在图片的百分比
                canvasCenterXChangePercent: 0.1, //每次移动x轴移动的百分比
                canvasCenterYChangePercent: 0.1 //每次移动y轴移动的百分比
            };

            if (typeof inSetting === "object") {
                for (var i in inSetting) {
                    this.setting[i] = inSetting[i];
                }
            }

            //创建canvas对象
            that.canvas = document.createElement("canvas");
            that.canvas.width = this.setting.canvasWidth;
            that.canvas.height = this.setting.canvasHeight;
            that.ctx = that.canvas.getContext("2d");

            //创建image对象
            that.image = new Image();
            that.image.src = this.setting.imgPath;
            that.image.onload = function () {
                let obj = that.setting;
                let img = that.image;

                //获取帧数
                obj.stepLen = img.height / img.width;

                obj.step = img.width;

                obj.stepTime = 2000 / obj.stepLen;

                //清空页面
                that.ctx.clearRect(0, 0, that.canvas.width, that.canvas.height);

                //判断是否是动图
                if (obj.stepBool) {

                    //绘制第一帧
                    that.ctx.drawImage(img, 0, 0, obj.step, obj.step, 0, 0, that.canvas.width, that.canvas.height);
                    //设置定时器，循环绘制

                    let interval = setInterval(function () {
                        //清空页面
                        that.ctx.clearRect(0, 0, that.canvas.width, that.canvas.height);

                        obj.stepIndex++;
                        if (obj.stepIndex >= obj.stepLen) obj.stepIndex = 0;
                        that.ctx.drawImage(img, 0, obj.step * obj.stepIndex, obj.step, obj.step, 0, 0, that.canvas.width, that.canvas.height);
                    }, obj.stepTime);

                    state.interval.push(interval);

                    return;
                }

                //初始化相关数据
                obj.scale = 1;
                obj.imgWidth = that.image.width;
                obj.imgHeight = that.image.height;
                obj.img = that.image;

                //判断是否绘制全屏
                if (that.setting.isFull) {
                    that.ctx.drawImage(obj.img, 0, 0, obj.imgWidth, obj.imgHeight, 0, 0, obj.canvasWidth, obj.canvasHeight);
                }
                else {
                    if (obj.imgWidth / obj.imgHeight >= obj.canvasWidth / obj.canvasHeight) {
                        //如果图片宽度比canvas宽度比大，计算出实际图片显示大小
                        obj.currentImgWidth = obj.canvasWidth;
                        obj.currentImgHeight = obj.currentImgWidth / (obj.imgWidth / obj.imgHeight);

                        obj.fullDistance = "width";

                        //设置默认配置
                        obj.img = img;
                        obj.sx = 0;
                        obj.sy = 0;
                        obj.swidth = obj.imgWidth;
                        obj.sheight = obj.imgHeight;
                        obj.x = 0;
                        obj.y = (obj.canvasHeight - obj.currentImgHeight) / 2;
                        obj.width = obj.currentImgWidth;
                        obj.height = obj.currentImgHeight;
                    }
                    else {
                        obj.currentImgHeight = obj.canvasHeight;
                        obj.currentImgWidth = obj.currentImgHeight * (obj.imgWidth / obj.imgHeight);

                        obj.fullDistance = "height";

                        //设置默认配置
                        obj.img = img;
                        obj.sx = 0;
                        obj.sy = 0;
                        obj.swidth = obj.imgWidth;
                        obj.sheight = obj.imgHeight;
                        obj.x = (obj.canvasWidth - obj.currentImgWidth) / 2;
                        obj.y = 0;
                        obj.width = obj.currentImgWidth;
                        obj.height = obj.currentImgHeight;
                    }

                    //重新绘制canvas
                    that.ctx.drawImage(obj.img, obj.sx, obj.sy, obj.swidth, obj.sheight, obj.x, obj.y, obj.width, obj.height);
                }

                //将当前状态改为true
                that.onload = true;
            };

            //修改canvas纹理
            this.changeImage = function (src) {
                if (typeof src === "object") {
                    this.image.src = src.src;
                }
                else {
                    this.image.src = src;
                }
            };

            //重新绘制canvas的纹理
            this.draw = function () {
                if (!this.onload) return;
                var cxt = this.ctx;
                var obj = this.setting;
                var that = this;
                var canvas = that.canvas;

                cxt.clearRect(0, 0, canvas.width, canvas.height);

                //首先判断scale倍数是否处于正常的倍数内
                if (obj.scale <= 1) {
                    obj.scale = 1;
                }
                else if (obj.scale > obj.maxScale) {
                    obj.scale = obj.maxScale;
                }

                //获取现在当前图片显示的高度和宽度
                var width = obj.currentImgWidth * obj.scale; //图片放大后的实际宽度
                var height = obj.currentImgHeight * obj.scale; //图片放大后的实际高度

                //确实显示宽度啊和切图位置
                if (width >= obj.canvasWidth) {
                    //现在缩放尺度已经大于了canvas的宽度

                    //首先保证中心点到最左侧能够渲染开，保证左侧不会出现白边
                    if (width * obj.canvasCenterXForImagePercent / 100 < obj.canvasWidth / 2) {
                        //如果中心点太偏左，矫正
                        obj.canvasCenterXForImagePercent = obj.canvasWidth / 2 / width * 100;
                    }
                    else if (width * (1 - obj.canvasCenterXForImagePercent / 100) < obj.canvasWidth / 2) {
                        //如果中心点太偏右，矫正百分比位置
                        obj.canvasCenterXForImagePercent = (1 - obj.canvasWidth / 2 / width) * 100;
                    }

                    obj.sx = (width * obj.canvasCenterXForImagePercent / 100 - obj.canvasWidth / 2) / width * obj.imgWidth; //图片裁剪开始位置
                    obj.swidth = obj.imgWidth * (obj.canvasWidth / width); //图片裁剪宽度

                    obj.x = 0; //绘制开始于canvas的位置
                    obj.width = obj.canvasWidth; //绘制的宽度
                }
                else {
                    obj.sx = 0; //图片裁剪开始位置
                    obj.swidth = obj.imgWidth; //图片裁剪宽度

                    obj.x = (obj.canvasWidth - width) / 2; //图片绘制开始位置
                    obj.width = width; //绘制的宽度
                }

                //确定裁剪的高度位置和绘制的位置
                if (height >= obj.canvasHeight) {
                    //如果当前缩放尺度大于canvas的高度

                    //首先保证没有白边，先判断百分比位置
                    if (height * obj.canvasCenterYForImagePercent / 100 < obj.canvasHeight / 2) {
                        obj.canvasCenterYForImagePercent = obj.canvasHeight / 2 / height * 100;
                    }
                    else if (height * (1 - obj.canvasCenterYForImagePercent / 100) < obj.canvasHeight / 2) {
                        obj.canvasCenterYForImagePercent = (1 - obj.canvasHeight / 2 / height) * 100;
                    }

                    obj.sy = (height * obj.canvasCenterYForImagePercent / 100 - obj.canvasHeight / 2) / height * obj.imgHeight; //图片裁剪开始位置
                    obj.sheight = obj.imgHeight * (obj.canvasHeight / height); //图片裁剪的高度

                    obj.y = 0; //绘制开始位置
                    obj.height = obj.canvasHeight; //绘制的高度
                }
                else {
                    obj.sy = 0; //图片裁剪开始位置
                    obj.sheight = obj.imgHeight; //图片裁剪的高度

                    obj.y = (obj.canvasHeight - height) / 2; //绘制开始位置
                    obj.height = height; //绘制的高度
                }

                //开始绘制
                cxt.drawImage(obj.img, obj.sx, obj.sy, obj.swidth, obj.sheight, obj.x, obj.y, obj.width, obj.height);
            };

            //获取canvas对象
            this.getCanvas = function () {
                return this.canvas;
            };

            //判断是否显示切换的按钮
            this.checkPosition = function (position) {
                var that = this;
                var HotSpotManager = that.HotSpotManager;
                var settings = that.setting;
                for (var i in HotSpotManager.hotSpotList) {
                    var hotObj = HotSpotManager.hotSpotList[i];
                    if (hotObj.typeName.name === "hot-pic" && hotObj.typeName.type === "changePosition") {
                        //获取热点图片的实际大小
                        var width = hotObj.position.Width;
                        var height = hotObj.position.Height;

                        //获取图形的中心点
                        var positionObj = HotSpotManager.computeTwoDistance({pan: hotObj.position.Pan, tilt: hotObj.position.Tilt}, {
                            pan: position.pan,
                            tilt: position.tilt
                        });
                        var x = positionObj.x / 45 * 0.9;
                        var y = positionObj.y / 45 * 0.9;

                        //获得热点的上下左右的边
                        var left = hotObj.position.Tx - width / 2 / 500;
                        var right = hotObj.position.Tx + width / 2 / 500;
                        var top = hotObj.position.Ty + height / 2 / 500;
                        var bottom = hotObj.position.Ty - height / 2 / 500;

                        //判断是否处在图形上方
                        if (x < right && x > left && y > bottom && y < top) {
                            hotObj.isShow = true;
                        }
                        else {
                            hotObj.isShow = false;
                        }
                    }
                }
            };

            //向上下左右移动的事件和放大缩小事件
            this.up = function () {
                this.setting.canvasCenterYForImagePercent -= this.setting.canvasCenterYChangePercent;
                this.draw();
            };

            this.down = function () {
                this.setting.canvasCenterYForImagePercent += this.setting.canvasCenterYChangePercent;
                this.draw();
            };

            this.left = function () {
                this.setting.canvasCenterXForImagePercent -= this.setting.canvasCenterXChangePercent;
                this.draw();
            };

            this.right = function () {
                this.setting.canvasCenterXForImagePercent += this.setting.canvasCenterXChangePercent;
                this.draw();
            };

            this.leftUp = function () {
                this.setting.canvasCenterYForImagePercent -= this.setting.canvasCenterYChangePercent;
                this.setting.canvasCenterXForImagePercent -= this.setting.canvasCenterXChangePercent;
                this.draw();
            };

            this.leftDown = function () {
                this.setting.canvasCenterYForImagePercent += this.setting.canvasCenterYChangePercent;
                this.setting.canvasCenterXForImagePercent -= this.setting.canvasCenterXChangePercent;
                this.draw();
            };

            this.rightUp = function () {
                this.setting.canvasCenterYForImagePercent -= this.setting.canvasCenterYChangePercent;
                this.setting.canvasCenterXForImagePercent += this.setting.canvasCenterXChangePercent;
                this.draw();
            };

            this.rightDown = function () {
                this.setting.canvasCenterYForImagePercent += this.setting.canvasCenterYChangePercent;
                this.setting.canvasCenterXForImagePercent += this.setting.canvasCenterXChangePercent;
                this.draw();
            };

            this.enlarge = function () {
                //放大效果
                this.setting.scale = this.setting.scale * this.setting.scrollScale;
                this.draw();
            };

            this.narrow = function () {
                //缩小效果
                this.setting.scale = this.setting.scale / this.setting.scrollScale;
                this.draw();
            }

        };

        return new DrawPic(setting);
    },
    //使用canvas绘制thumbnail
    _canvasDrawThumbnail: function (options) {
        var hotSpotManager = this;

        function canvasDrawThumbnail(options) {
            var that = this;
            this.settings = options;
            //通过配置项计算出来8个thumbnail的位置
            this.thumbnailPositionList = [];
            //先计算出来thumbnail的宽度
            this.thumbnailWidth = (options.settings.thumbnailContentWrapWidth - options.settings.thumbnailSpaceX * 5) / 4; //缩略图宽度
            this.thumbnailAndTileHeight = (options.settings.thumbnailContentWrapHeight - options.settings.thumbnailSpaceY * 3) / 2; //缩略图+title高度
            this.thumbnailHeight = this.thumbnailAndTileHeight - options.settings.thumbnailTitleLineHeight; //缩略图高度
            this.oneTransition = 500; //一个位置的距离长度
            this.index = 0; //当前显示的页面的下标
            this.page = Math.ceil(options.sceneArr.length / 8); //一共可以生成的页面数

            //生成8个位置的数组
            this.createPositionList = function () {

                var options = this.settings.settings;

                //计算出来所需的位置信息
                var firstColsTX = -(that.thumbnailWidth + options.thumbnailSpaceX) * 1.5 / that.oneTransition; //第一列的缩略图的x偏移量
                var secondColsTX = -(that.thumbnailWidth + options.thumbnailSpaceX) * 0.5 / that.oneTransition; //第二列的缩略图的x偏移量
                var thirdColsTX = (that.thumbnailWidth + options.thumbnailSpaceX) * 0.5 / that.oneTransition; //第三列的缩略图的x偏移量
                var fourthColsTX = (that.thumbnailWidth + options.thumbnailSpaceX) * 1.5 / that.oneTransition; //第四列的缩略图的x偏移量

                var upperThumbTY = ((that.thumbnailHeight + options.thumbnailSpaceY) * 0.5 + options.thumbnailTitleLineHeight) / that.oneTransition; //上面的缩略图的y轴偏移量
                var lowerThumbTY = -(that.thumbnailHeight + options.thumbnailSpaceY) * 0.5 / that.oneTransition; //下方的缩略图的y轴偏移量

                var upperTitleTY = ((options.thumbnailTitleLineHeight + options.thumbnailSpaceY) * 0.5) / that.oneTransition; //上面的标题的y轴偏移量
                var lowerTitleTY = -((options.thumbnailTitleLineHeight + options.thumbnailSpaceY) * 0.5 + that.thumbnailHeight) / that.oneTransition; //下面的标题的y轴偏移量

                //计算出来第一个缩略图和title标题的位置
                this.thumbnailPositionList[0] = {};
                this.thumbnailPositionList[0].thumbTX = firstColsTX;
                this.thumbnailPositionList[0].thumbTY = upperThumbTY;
                this.thumbnailPositionList[0].titleTX = firstColsTX;
                this.thumbnailPositionList[0].titleTY = upperTitleTY;

                //计算出来第二个缩略图和title标题的位置
                this.thumbnailPositionList[1] = {};
                this.thumbnailPositionList[1].thumbTX = secondColsTX;
                this.thumbnailPositionList[1].thumbTY = upperThumbTY;
                this.thumbnailPositionList[1].titleTX = secondColsTX;
                this.thumbnailPositionList[1].titleTY = upperTitleTY;

                //计算出来第三个缩略图和title标题的位置
                this.thumbnailPositionList[2] = {};
                this.thumbnailPositionList[2].thumbTX = thirdColsTX;
                this.thumbnailPositionList[2].thumbTY = upperThumbTY;
                this.thumbnailPositionList[2].titleTX = thirdColsTX;
                this.thumbnailPositionList[2].titleTY = upperTitleTY;

                //计算出来第四个缩略图和title标题的位置
                this.thumbnailPositionList[3] = {};
                this.thumbnailPositionList[3].thumbTX = fourthColsTX;
                this.thumbnailPositionList[3].thumbTY = upperThumbTY;
                this.thumbnailPositionList[3].titleTX = fourthColsTX;
                this.thumbnailPositionList[3].titleTY = upperTitleTY;

                //计算出来第五个缩略图和title标题的位置
                this.thumbnailPositionList[4] = {};
                this.thumbnailPositionList[4].thumbTX = firstColsTX;
                this.thumbnailPositionList[4].thumbTY = lowerThumbTY;
                this.thumbnailPositionList[4].titleTX = firstColsTX;
                this.thumbnailPositionList[4].titleTY = lowerTitleTY;

                //计算出来第六个缩略图和title标题的位置
                this.thumbnailPositionList[5] = {};
                this.thumbnailPositionList[5].thumbTX = secondColsTX;
                this.thumbnailPositionList[5].thumbTY = lowerThumbTY;
                this.thumbnailPositionList[5].titleTX = secondColsTX;
                this.thumbnailPositionList[5].titleTY = lowerTitleTY;

                //计算出来第七个缩略图和title标题的位置
                this.thumbnailPositionList[6] = {};
                this.thumbnailPositionList[6].thumbTX = thirdColsTX;
                this.thumbnailPositionList[6].thumbTY = lowerThumbTY;
                this.thumbnailPositionList[6].titleTX = thirdColsTX;
                this.thumbnailPositionList[6].titleTY = lowerTitleTY;

                //计算出来第八个缩略图和title标题的位置
                this.thumbnailPositionList[7] = {};
                this.thumbnailPositionList[7].thumbTX = fourthColsTX;
                this.thumbnailPositionList[7].thumbTY = lowerThumbTY;
                this.thumbnailPositionList[7].titleTX = fourthColsTX;
                this.thumbnailPositionList[7].titleTY = lowerTitleTY;
            };

            //通过数据生成需要渲染的对象
            this.createThumbnailObj = function () {
                var that = this;
                var arr = []; //thumbnail对象的数组
                var positionList = that.thumbnailPositionList; //存储位置的数组
                var sceneArr = options.sceneArr; //场景数组
                var settings = options.settings; //数据
                var hotSpotManager = options.hotSpotManager; //vr场景对象

                //清空之前的数据
                that.removeThumbnailObj();

                for (var i = 0; i < positionList.length; i++) {
                    //如果下标超过场景的长度，退出循环
                    if (that.index * 8 + i >= sceneArr.length) {
                        break;
                    }
                    var index = that.index * 8 + i;

                    //生成thumbnail对象
                    var pic = that.createPic({
                        height: that.thumbnailHeight,
                        width: that.thumbnailWidth,
                        src: sceneArr[index].thumbnail
                    });
                    arr.push({
                        /*"Actions": [],*/
                        "HotspotID": "AlertThumbnailListPic" + i, //切换上一组thumbnail
                        "Name": "111",
                        "Type": "Image",
                        "Attributes": {},
                        Canvas: {
                            CanvasNormal: pic,
                            CanvasOver: pic
                        },
                        "Positions": [{
                            "Alpha": 1,
                            "Pan": options.thumbnailPan,
                            "Tilt": 0,
                            "Rx": 0,
                            "Ry": 0,
                            "Rz": 0,
                            "Tx": positionList[i].thumbTX,
                            "Ty": positionList[i].thumbTY,
                            "Sx": 1,
                            "Sy": 1,
                            "Width": that.thumbnailWidth,
                            "Height": that.thumbnailHeight
                        }],
                        modelType: "alert", //设置绘制的图形的类别
                        typeName: { //明确具体的功能位置
                            name: "thumbnail-list", //属于缩略图列表
                            type: "pic", //对象的类型 缩略图
                            index: i //下标
                        }
                    });

                    //生成title对象
                    var canvas = hotSpotManager.CreateTitle({
                        canvas: document.createElement("canvas"), //显示的canvas
                        width: that.thumbnailWidth, //显示的canvas宽度
                        height: settings.thumbnailTitleLineHeight, //显示的canvas高度
                        text: sceneArr[index].sceneName, //显示的内容
                        font: settings.thumbnailTitleFont, //字体样式
                        color: settings.thumbnailTitleColor, //字体颜色
                        backgroundColor: settings.thumbnailTitleBackgroundColor, //背景色
                        textMoveStep: settings.thumbnailTitleMove //文字移动的速度
                    });

                    canvas.init();
                    arr.push({
                        /*"Actions": [],*/
                        "HotspotID": "AlertThumbnailListTitle" + i, //切换上一组thumbnail
                        "Name": "222",
                        "Type": "Image",
                        "Attributes": {},
                        Canvas: {
                            CanvasNormal: canvas.getCanvas(),
                            CanvasOver: canvas.getCanvas()
                        },
                        "Positions": [{
                            "Alpha": 1,
                            "Pan": options.thumbnailPan,
                            "Tilt": 0,
                            "Rx": 0,
                            "Ry": 0,
                            "Rz": 0,
                            "Tx": positionList[i].titleTX,
                            "Ty": positionList[i].titleTY,
                            "Sx": 1,
                            "Sy": 1,
                            "Width": that.thumbnailWidth,
                            "Height": settings.thumbnailTitleLineHeight
                        }],
                        modelType: "alert", //设置绘制的图形的类别
                        typeName: { //明确具体的功能位置
                            name: "thumbnail-list", //属于缩略图列表
                            type: "title", //对象的类型 标题
                            index: i, //下标
                            canvas: canvas //title对象
                        }
                    });

                    //生成显示的播放按钮
                    arr.push({
                        "Actions": [{
                            "Name": "action_changeScene",
                            "Triggers": {"Type": "mouse_click", "Delay": 0},
                            "Params": {
                                "sceneId": sceneArr[index].sceneId,
                                "quality": 2,
                                "time": 0,
                                "pan": sceneArr[index].initPan,
                                "tilt": sceneArr[index].initTilt,
                                "fov": sceneArr[index].initFov
                            }
                        }],
                        "HotspotID": "AlertThumbnailListBtn" + i, //切换上一组thumbnail
                        "Name": "",
                        "Type": "Image",
                        "Attributes": {
                            "ImageNormal": settings.thumbnailBtnBackgroundImageNormal,
                            "ImageOver": settings.thumbnailBtnBackgroundImageOver
                        },
                        "Positions": [{
                            "Alpha": 1,
                            "Pan": options.thumbnailPan,
                            "Tilt": 0,
                            "Rx": 0,
                            "Ry": 0,
                            "Rz": 0,
                            "Tx": positionList[i].thumbTX,
                            "Ty": positionList[i].thumbTY,
                            "Sx": 1,
                            "Sy": 1,
                            "Width": settings.thumbnailBtnWidth,
                            "Height": settings.thumbnailBtnHeight
                        }],
                        modelType: "alert", //设置绘制的图形的类别
                        typeName: { //明确具体的功能位置
                            name: "thumbnail-list", //属于缩略图列表
                            type: "btn", //对象的类型 按钮
                            index: i //下标
                        }
                    });
                }

                //添加显示页面数
                arr.push({
                    "HotspotID": "AlertThumbnailListPage", //切换上一组thumbnail
                    "Name": that.index + 1 + "/" + that.page,
                    "Type": "Image",
                    "Attributes": {},
                    "Positions": [{
                        "Alpha": 1,
                        "Pan": options.thumbnailPan,
                        "Tilt": 0,
                        "Rx": 0,
                        "Ry": 0,
                        "Rz": 0,
                        "Tx": settings.thumbnailPageTranslateX,
                        "Ty": settings.thumbnailPageTranslateY,
                        "Sx": 1,
                        "Sy": 1,
                        "Width": settings.thumbnailPageWidth,
                        "Height": settings.thumbnailPageHeight
                    }],
                    modelType: "alert", //设置绘制的图形的类别
                    typeName: { //明确具体的功能位置
                        name: "thumbnail-list", //属于缩略图列表
                        type: "page" //对象的类型 标题
                    }
                });

                for (var i = 0, len = arr.length; i < len; i++) {
                    var obj = hotSpotManager.createHost(arr[i], false);
                    //添加上modelType
                    obj.modelType = arr[i].modelType;
                    if (arr[i].typeName.type === "btn") {
                        obj.isShow = false;
                    }
                    else {
                        obj.isShow = true;//是否显示
                    }
                    obj.typeName = arr[i].typeName;
                    obj.position = arr[i].Positions[0];
                    hotSpotManager.hotSpotList[arr[i].HotspotID] = obj;
                }
            };

            //清除现在已经存在的缩略图对象
            this.removeThumbnailObj = function () {
                var that = this;
                var arr = []; //thumbnail对象的数组
                var positionList = that.thumbnailPositionList; //存储位置的数组
                var sceneArr = options.sceneArr; //场景数组
                var settings = options.settings; //数据
                var hotSpotManager = options.hotSpotManager; //vr场景对象

                for (var i in hotSpotManager.hotSpotList) {
                    if (hotSpotManager.hotSpotList[i].typeName.name === "thumbnail-list") {
                        hotSpotManager.hotSpotList[i] = null;
                        delete hotSpotManager.hotSpotList[i];
                    }
                }
            };

            //创建图片的canvas
            this.createPic = function (options) {
                var canvas = document.createElement("canvas");
                canvas.height = options.height;
                canvas.width = options.width;
                var ctx = canvas.getContext("2d");
                var img = new Image();
                img.src = options.src;
                img.onload = function () {
                    ctx.drawImage(img, 0, 0, img.width, img.height, 0, 0, options.width, options.height);
                };

                return canvas;
            };

            //第一次打开先生成以下页面
            this.init = function () {

                this.createPositionList();

                this.createThumbnailObj();
            };

            //向上一页方法
            this.prev = function () {
                this.index--;
                if (this.index < 0) {
                    this.index = 0;
                }
                else {
                    this.createThumbnailObj();
                }
            };

            //向下一页的方法
            this.next = function () {
                this.index++;
                if (this.index > this.page - 1) {
                    this.index = this.page - 1;
                }
                else {
                    this.createThumbnailObj();
                }
            };
        }

        return new canvasDrawThumbnail(options);
    },
    //使用canvas绘制纹理的构造函数
    _canvasDrawPlane: function (inSetting) {
        var that = this;
        //配置项
        this.setting = {
            img: null, //图片对象
            imgPath: "10.jpg", // 图片地址路径
            imgWidth: 0, //图片的宽度
            imgHeight: 0, //图片的高度
            canvasWidth: 480, //canvas的宽度
            canvasHeight: 360, //canvas的高度
            currentImgWidth: 0, //实际绘制的宽度
            currentImgHeight: 0, //实际绘制的高度
            centerOffsetLeft: 0, //窗口中心点距离左侧的距离
            centerOffsetTop: 0, //窗口中心点距离图片顶部距离
            //缩放相关的一些属性
            scale: 1, //当前图片的缩放
            scrollScale: 1.005, //每次事件图片放大的倍数
            maxScale: 5, //图形可以放大的最大倍数
            fullDistance: "", //默认状态下百分百的是宽度还是高度 width or height
            //canvas渲染的一些相关属性
            sx: 0, //开始剪切的 x 坐标位置
            sy: 0, //开始剪切的 y 坐标位置
            swidth: 0, //被剪切图像的宽度
            sheight: 0, //被剪切图像的高度
            x: 0, //在画布上放置图像的 x 坐标位置
            y: 0, //在画布上放置图像的 y 坐标位置
            width: 0, //要使用的图像的宽度。（伸展或缩小图像）
            height: 0, //要使用的图像的高度。（伸展或缩小图像）
            //当前canvas中心点在图片中的点的位置的百分比
            canvasCenterXForImagePercent: 50, //中心x轴在图片的百分比
            canvasCenterYForImagePercent: 50, //中心点y轴在图片的百分比
            canvasCenterXChangePercent: 0.1, //每次移动x轴移动的百分比
            canvasCenterYChangePercent: 0.1, //每次移动y轴移动的百分比
            onload: false //当前图片是否加载成功
        };

        //HotSpotManager对象
        this.HotSpotManager = inSetting.HotSpotManager;

        //当前平面地图的所有数据
        this.mapData = inSetting.mapData;

        if (typeof inSetting === "object") {
            for (var i in inSetting) {
                this.setting[i] = inSetting[i];
            }
        }

        this.init = function () {
            //创建canvas对象
            this.canvas = document.createElement("canvas");
            this.canvas.width = this.setting.canvasWidth;
            this.canvas.height = this.setting.canvasHeight;
            this.ctx = this.canvas.getContext("2d");

            //创建image对象
            this.image = new Image();
            this.image.src = this.setting.imgPath;
            this.image.onload = function () {
                var obj = that.setting;
                var img = that.image;

                //清空页面
                that.ctx.clearRect(0, 0, that.canvas.width, that.canvas.height);
                //初始化相关数据
                obj.scale = 1;
                obj.imgWidth = that.image.width;
                obj.imgHeight = that.image.height;
                obj.img = that.image;

                if (obj.imgWidth / obj.imgHeight >= obj.canvasWidth / obj.canvasHeight) {
                    //如果图片宽度比canvas宽度比大，计算出实际图片显示大小
                    obj.currentImgWidth = obj.canvasWidth;
                    obj.currentImgHeight = obj.currentImgWidth / (obj.imgWidth / obj.imgHeight);

                    obj.fullDistance = "width";

                    //设置默认配置
                    obj.img = img;
                    obj.sx = 0;
                    obj.sy = 0;
                    obj.swidth = obj.imgWidth;
                    obj.sheight = obj.imgHeight;
                    obj.x = 0;
                    obj.y = (obj.canvasHeight - obj.currentImgHeight) / 2;
                    obj.width = obj.currentImgWidth;
                    obj.height = obj.currentImgHeight;
                }
                else {
                    obj.currentImgHeight = obj.canvasHeight;
                    obj.currentImgWidth = obj.currentImgHeight * (obj.imgWidth / obj.imgHeight);

                    obj.fullDistance = "height";

                    //设置默认配置
                    obj.img = img;
                    obj.sx = 0;
                    obj.sy = 0;
                    obj.swidth = obj.imgWidth;
                    obj.sheight = obj.imgHeight;
                    obj.x = (obj.canvasWidth - obj.currentImgWidth) / 2;
                    obj.y = 0;
                    obj.width = obj.currentImgWidth;
                    obj.height = obj.currentImgHeight;
                }

                //重新绘制canvas
                that.ctx.drawImage(obj.img, obj.sx, obj.sy, obj.swidth, obj.sheight, obj.x, obj.y, obj.width, obj.height);

                //修改中心点所处在图片的位置
                that.updateCenterPosition();

                //添加平面地图的热点
                that.addPlaneHot();

                //修改图片加载状态
                obj.onload = true;
            };
        };

        //添加平面地图热点
        this.addPlaneHot = function () {
            var that = this;
            var data = this.mapData.data;
            for (var i = 0; i < data.length; i++) {
                (function (obj, index) {
                    var img = new Image();
                    img.src = obj.icon.src;
                    img.onload = function () {
                        obj.img = img;
                        that.createHotPoint(obj, index);
                    }
                })(data[i], i);
            }
        };

        //根据位置，图片大小生成热点图标
        this.createHotPoint = function (obj, index) {
            var that = this;
            var settings = that.setting;
            var playerObj = that.HotSpotManager.playerObj;
            var scale = settings.currentImgWidth / settings.imgWidth * settings.scale; //当前缩放倍数

            //计算出来热点的偏移Tx和Ty
            var Tx = (obj.pan - settings.centerOffsetLeft) * scale / 500;
            var Ty = -(obj.tilt - settings.centerOffsetTop) * scale / 500;

            var img = new Image();
            img.src = obj.icon.src;
            img.onload = function () {
                var imgWidth = img.width;
                var imgHeight = img.height;

                var sceneObj = playerObj.api_getSceneDataById(obj.sceneId);

                //生成canvas对象
                var canvas = that.createPic({src: img.src, height: imgWidth * scale, width: imgHeight * scale});

                //生成obj对象
                var hotObj = {
                    "Actions": [{
                        "Name": "action_changeScene",
                        "Triggers": {"Type": "mouse_click", "Delay": 0},
                        "Params": {
                            "sceneId": sceneObj.sceneId,
                            "quality": 2,
                            "time": 0,
                            "pan": sceneObj.initPan,
                            "tilt": sceneObj.initTilt,
                            "fov": sceneObj.initFov
                        }
                    }],
                    "HotspotID": "planeHot-" + index, //热点的id
                    "Name": "",
                    "Type": "Image",
                    "Attributes": {
                        "ImageNormal": img.src,
                        "ImageOver": img.src
                    },
                    "Positions": [{
                        "Alpha": 1,
                        "Pan": settings.pan,
                        "Tilt": 0,
                        "Rx": 0,
                        "Ry": 0,
                        "Rz": 0,
                        "Tx": Tx,
                        "Ty": Ty,
                        "Sx": scale,
                        "Sy": scale,
                        "Width": imgWidth,
                        "Height": imgHeight
                    }],
                    modelType: "alert", //设置绘制的图形的类别
                    typeName: { //明确具体的功能位置
                        name: "plane-list", //属于缩略图列表
                        type: "hot", //对象的类型 按钮
                        obj: obj, //热点对象
                        index: index //下标
                    }
                };

                //添加到显示列表
                var myObj = that.HotSpotManager.createHost(hotObj, false);
                //添加上modelType
                myObj.modelType = hotObj.modelType;
                myObj.typeName = hotObj.typeName;
                myObj.isShow = true;//是否显示
                myObj.position = hotObj.Positions[0];
                that.HotSpotManager.hotSpotList[hotObj.HotspotID] = myObj;
            };

        };

        //修改背景canvas纹理
        this.changeImage = function (src) {
            this.image.src = src;
        };

        //创建图片的canvas
        this.createPic = function (options) {
            var canvas = document.createElement("canvas");
            canvas.height = options.height;
            canvas.width = options.width;
            var ctx = canvas.getContext("2d");
            var img = new Image();
            img.src = options.src;
            img.onload = function () {
                ctx.drawImage(img, 0, 0, img.width, img.height, 0, 0, options.width, options.height);
            };

            return canvas;
        };

        //重新绘制canvas的纹理
        this.draw = function () {
            if (!this.setting.onload) return;
            var cxt = this.ctx;
            var obj = this.setting;
            var that = this;
            var canvas = that.canvas;

            cxt.clearRect(0, 0, canvas.width, canvas.height);

            //首先判断scale倍数是否处于正常的倍数内
            if (obj.scale <= 1) {
                obj.scale = 1;
            }
            else if (obj.scale > obj.maxScale) {
                obj.scale = obj.maxScale;
            }

            //获取现在当前图片显示的高度和宽度
            var width = obj.currentImgWidth * obj.scale; //图片放大后的实际宽度
            var height = obj.currentImgHeight * obj.scale; //图片放大后的实际高度

            //确实显示宽度啊和切图位置
            if (width >= obj.canvasWidth) {
                //现在缩放尺度已经大于了canvas的宽度

                //首先保证中心点到最左侧能够渲染开，保证左侧不会出现白边
                if (width * obj.canvasCenterXForImagePercent / 100 < obj.canvasWidth / 2) {
                    //如果中心点太偏左，矫正
                    obj.canvasCenterXForImagePercent = obj.canvasWidth / 2 / width * 100;
                }
                else if (width * (1 - obj.canvasCenterXForImagePercent / 100) < obj.canvasWidth / 2) {
                    //如果中心点太偏右，矫正百分比位置
                    obj.canvasCenterXForImagePercent = (1 - obj.canvasWidth / 2 / width) * 100;
                }

                obj.sx = (width * obj.canvasCenterXForImagePercent / 100 - obj.canvasWidth / 2) / width * obj.imgWidth; //图片裁剪开始位置
                obj.swidth = obj.imgWidth * (obj.canvasWidth / width); //图片裁剪宽度

                obj.x = 0; //绘制开始于canvas的位置
                obj.width = obj.canvasWidth; //绘制的宽度
            }
            else {
                obj.sx = 0; //图片裁剪开始位置
                obj.swidth = obj.imgWidth; //图片裁剪宽度

                obj.x = (obj.canvasWidth - width) / 2; //图片绘制开始位置
                obj.width = width; //绘制的宽度
            }

            //确定裁剪的高度位置和绘制的位置
            if (height >= obj.canvasHeight) {
                //如果当前缩放尺度大于canvas的高度

                //首先保证没有白边，先判断百分比位置
                if (height * obj.canvasCenterYForImagePercent / 100 < obj.canvasHeight / 2) {
                    obj.canvasCenterYForImagePercent = obj.canvasHeight / 2 / height * 100;
                }
                else if (height * (1 - obj.canvasCenterYForImagePercent / 100) < obj.canvasHeight / 2) {
                    obj.canvasCenterYForImagePercent = (1 - obj.canvasHeight / 2 / height) * 100;
                }

                obj.sy = (height * obj.canvasCenterYForImagePercent / 100 - obj.canvasHeight / 2) / height * obj.imgHeight; //图片裁剪开始位置
                obj.sheight = obj.imgHeight * (obj.canvasHeight / height); //图片裁剪的高度

                obj.y = 0; //绘制开始位置
                obj.height = obj.canvasHeight; //绘制的高度
            }
            else {
                obj.sy = 0; //图片裁剪开始位置
                obj.sheight = obj.imgHeight; //图片裁剪的高度

                obj.y = (obj.canvasHeight - height) / 2; //绘制开始位置
                obj.height = height; //绘制的高度
            }

            //开始绘制
            cxt.drawImage(obj.img, obj.sx, obj.sy, obj.swidth, obj.sheight, obj.x, obj.y, obj.width, obj.height);

            //修改中心点所处在图片的位置
            that.updateCenterPosition();

            //更新热点的位置
            that.updateHotPoint();
        };

        //更新中心点的位置数据
        this.updateCenterPosition = function () {
            var settings = this.setting;
            settings.centerOffsetLeft = settings.sx + settings.swidth / 2;
            settings.centerOffsetTop = settings.sy + settings.sheight / 2;
        };

        //更新热点的位置，并重新渲染
        this.updateHotPoint = function () {
            var that = this;
            var settings = that.setting;
            var playerObj = that.HotSpotManager.playerObj;
            var HotSpotManager = that.HotSpotManager;
            var planeSettings = HotSpotManager.toolSetting.planeMap;

            //循环更新矩阵
            for (var i in HotSpotManager.hotSpotList) {
                var hotObj = HotSpotManager.hotSpotList[i];
                if (hotObj.typeName.name === "plane-list" && hotObj.typeName.type === "hot") {
                    var obj = hotObj.typeName.obj;

                    var scale = settings.currentImgWidth / settings.imgWidth * settings.scale; //当前缩放倍数

                    //计算出来热点的偏移Tx和Ty
                    var Tx = (obj.pan - settings.centerOffsetLeft) * scale / 500;
                    var Ty = -(obj.tilt - settings.centerOffsetTop) * scale / 500;

                    hotObj.position.Sx = hotObj.position.Sy = scale;
                    hotObj.position.Tx = Tx;
                    hotObj.position.Ty = Ty;

                    //重新生成矩阵 重新绑定纹理
                    HotSpotManager.webGLUpdateBuffer(hotObj);

                    //获取热点图片的实际大小
                    var width = hotObj.position.Width;
                    var height = hotObj.position.Height;

                    //获取热点的实际位置
                    var x = 500 * Tx;
                    var y = 500 * Ty;

                    //获取显示区域的宽高
                    var wrapWidth = planeSettings.hotPicContentWrapWidth;
                    var wrapHeight = planeSettings.hotPicContentWrapHeight;

                    //获得热点的上下左右的边
                    var left = x - width * scale / 2;
                    var right = x + width * scale / 2;
                    var top = y - height * scale / 2;
                    var bottom = y + height * scale / 2;


                    //判断当前的平面地图的热点是否需要被绘制出来
                    if (right > wrapWidth / 2 || left < -wrapWidth / 2 || top < -wrapHeight / 2 || bottom > wrapHeight / 2) {
                        hotObj.isShow = false;
                    }
                    else {
                        hotObj.isShow = true;
                    }

                }
            }
        };

        //获取canvas对象
        this.getCanvas = function () {
            return this.canvas;
        };

        //判断是否显示切换的按钮
        this.checkPosition = function (position) {
            var that = this;
            var HotSpotManager = that.HotSpotManager;
            var settings = that.setting;
            for (var i in HotSpotManager.hotSpotList) {
                var hotObj = HotSpotManager.hotSpotList[i];
                if (hotObj.typeName.name === "hot-pic" && hotObj.typeName.type === "changePosition") {
                    //获取热点图片的实际大小
                    var width = hotObj.position.Width;
                    var height = hotObj.position.Height;

                    //获取图形的中心点
                    var positionObj = HotSpotManager.computeTwoDistance({pan: hotObj.position.Pan, tilt: hotObj.position.Tilt}, {
                        pan: position.pan,
                        tilt: position.tilt
                    });
                    var x = positionObj.x / 45 * 0.9;
                    var y = positionObj.y / 45 * 0.9;

                    //获得热点的上下左右的边
                    var left = hotObj.position.Tx - width / 2 / 500;
                    var right = hotObj.position.Tx + width / 2 / 500;
                    var top = hotObj.position.Ty + height / 2 / 500;
                    var bottom = hotObj.position.Ty - height / 2 / 500;

                    //判断是否处在图形上方
                    if (x < right && x > left && y > bottom && y < top) {
                        hotObj.isShow = true;
                    }
                    else {
                        hotObj.isShow = false;
                    }
                }
            }
        };

        //向上下左右移动的事件和放大缩小事件
        this.up = function () {
            this.setting.canvasCenterYForImagePercent -= this.setting.canvasCenterYChangePercent;
            this.draw();
        };

        this.down = function () {
            this.setting.canvasCenterYForImagePercent += this.setting.canvasCenterYChangePercent;
            this.draw();
        };

        this.left = function () {
            this.setting.canvasCenterXForImagePercent -= this.setting.canvasCenterXChangePercent;
            this.draw();
        };

        this.right = function () {
            this.setting.canvasCenterXForImagePercent += this.setting.canvasCenterXChangePercent;
            this.draw();
        };

        this.leftUp = function () {
            this.setting.canvasCenterYForImagePercent -= this.setting.canvasCenterYChangePercent;
            this.setting.canvasCenterXForImagePercent -= this.setting.canvasCenterXChangePercent;
            this.draw();
        };

        this.leftDown = function () {
            this.setting.canvasCenterYForImagePercent += this.setting.canvasCenterYChangePercent;
            this.setting.canvasCenterXForImagePercent -= this.setting.canvasCenterXChangePercent;
            this.draw();
        };

        this.rightUp = function () {
            this.setting.canvasCenterYForImagePercent -= this.setting.canvasCenterYChangePercent;
            this.setting.canvasCenterXForImagePercent += this.setting.canvasCenterXChangePercent;
            this.draw();
        };

        this.rightDown = function () {
            this.setting.canvasCenterYForImagePercent += this.setting.canvasCenterYChangePercent;
            this.setting.canvasCenterXForImagePercent += this.setting.canvasCenterXChangePercent;
            this.draw();
        };

        this.enlarge = function () {
            //放大效果
            this.setting.scale = this.setting.scale * this.setting.scrollScale;
            this.draw();
        };

        this.narrow = function () {
            //缩小效果
            this.setting.scale = this.setting.scale / this.setting.scrollScale;
            this.draw();
        }

    },
    //使用canvas绘制video标签的构造函数
    _canvasDrawVideo: function (options) {
        this.settings = {
            canvas: document.createElement("canvas"),
            videoSrc: "image/video.mp4", //视频文件地址
            canvasWidth: 580, //canvas的宽度
            canvasHeight: 360, //canvas的高度
            videoWidth: 580, //获取视频文件的宽度
            videoHeight: 360, //获取视频文件的高度
            background: "#ffffff", //canvas的背景颜色

            //绘制的
            playCanvas: "", //图片canvas的实例化对象
            playPic: "", //播放按钮图片
            pausePic: "", //暂停按钮图片

            //绘制专用
            video: null, //用于绘制canvas的video对象
            x: 0,	//在画布上放置图像的 x 坐标位置。
            y: 0,	//在画布上放置图像的 y 坐标位置。
            width: 0,	//可选。要使用的图像的宽度。（伸展或缩小图像）
            height: 0,	//可选。要使用的图像的高度。（伸展或缩小图像）

            //video相关配置
            volume: 0.6, //video的默认音量
            volumeTimeOut: null, //声音提示的消失延迟器
            volumeTime: 2000, //消失的延迟时间
            volumePic: "vr/volume.png", //音量显示图标
            volumePicWidth: 40, //音量按钮的宽度
            volumePicHeight: 40, //音量按钮的高度
            volumeStep: 0.02, //每次增加音量或减少多少音量

            //设置快进快退的相关配置
            wardStep: 1, //每帧快进或快退的幅度，单位秒
            isWard: false, //是否处于快进或快退的状态当中
            currentWard: -1, //当前的快进或快退中的位置

            //进度条的配置
            progressHeight: 3, //进度条的高度
            progressColor: "#00ffff", //进度条的颜色
            progressBgColor: "rgba(0,0,0,.3)" //进度条背景色
        };

        this.init = function () {
            var that = this;
            var settings = that.settings;

            for (var i in options) {
                settings[i] = options[i];
            }

            settings.ctx = settings.canvas.getContext("2d");
            settings.video = document.createElement("video");

            //绑定图片切换事件
            settings.video.onpause = function () {
                settings.playCanvas.changeImage(settings.playPic);
            };

            settings.video.onplay = function () {
                settings.playCanvas.changeImage(settings.pausePic);
            };

            settings.video.src = settings.videoSrc;
            settings.video.volume = settings.volume;

            //设置canvas的宽度和高度
            settings.canvas.width = settings.canvasWidth;
            settings.canvas.height = settings.canvasHeight;

            //视频的相关数据加载完成后的回调
            settings.video.onloadeddata = function () {
                //存储视频的帧尺寸
                settings.videoWidth = settings.video.videoWidth;
                settings.videoHeight = settings.video.videoHeight;
                //计算数据进行绘制
                if (settings.canvasWidth / settings.canvasHeight >= settings.videoWidth / settings.videoHeight) {
                    //如果canvas 宽度比例宽于 视频的宽度
                    //计算出来vdieo应该绘制的宽度和高度
                    settings.height = settings.canvasHeight;
                    settings.y = 0;
                    settings.width = settings.height * settings.videoWidth / settings.videoHeight;
                    settings.x = (settings.canvasWidth - settings.width) / 2;
                }
                else {
                    //如果canvas 的高度比例高于视频的高度
                    settings.width = settings.canvasWidth;
                    settings.x = 0;
                    settings.height = settings.width * settings.videoHeight / settings.videoWidth;
                    settings.y = (settings.canvasHeight - settings.height) / 2;
                }

                that.drawing();
            }
        };

        //绘制方法，每一帧调用一次
        this.drawing = function () {
            var that = this;
            var settings = that.settings;
            //绘制白色底部
            settings.ctx.fillStyle = settings.background;
            settings.ctx.fillRect(0, 0, settings.canvasWidth, settings.canvasHeight);
            //绘制视频
            settings.ctx.drawImage(settings.video, settings.x, settings.y, settings.width, settings.height);
            //判断是否需要绘制显示音量
            if (settings.volumeTimeOut) {

            }
            //绘制进度条
            if (!settings.isWard) {
                //如果不处于快进或者快退状态，计算出来当前的播放的位置
                settings.percent = settings.video.currentTime / settings.video.duration;
                settings.ctx.fillStyle = settings.progressBgColor;
                //绘制背景色
                settings.ctx.fillRect(0, settings.canvasHeight - settings.progressHeight, settings.canvasWidth, settings.progressHeight);
                //绘制进度
                settings.ctx.fillStyle = settings.progressColor;
                settings.ctx.fillRect(0, settings.canvasHeight - settings.progressHeight, settings.canvasWidth * settings.percent, settings.progressHeight);
            }
            else {
                //如果处于快进或者快退状态，照常播放，但是进度条会响应移动
                var percent = settings.currentWard / settings.video.duration;
                settings.ctx.fillStyle = settings.progressBgColor;
                //绘制背景色
                settings.ctx.fillRect(0, settings.canvasHeight - settings.progressHeight, settings.canvasWidth, settings.progressHeight);
                //绘制进度
                settings.ctx.fillStyle = settings.progressColor;
                settings.ctx.fillRect(0, settings.canvasHeight - settings.progressHeight, settings.canvasWidth * percent, settings.progressHeight);
            }
        };

        //播放事件
        this.play = function () {
            var that = this;
            var settings = that.settings;
            settings.video.play();
        };

        //暂停事件
        this.pause = function () {
            var that = this;
            var settings = that.settings;
            settings.video.pause();
        };

        //播放暂停切换
        this.changePlay = function () {
            var that = this;
            var settings = that.settings;

            //判断处于什么状态
            if (settings.video.paused) {
                //如果video不处于播放状态
                that.play();
            }
            else {
                //如果播放器处于播放状态
                that.pause();
            }
        };

        //增加音量
        this.volumeUp = function () {
            var that = this;
            var settings = that.settings;

            //音量增加
            var volume = settings.video.volume;
            volume += settings.volumeStep;
            if (volume > 1) {
                volume = 1;
            }
            settings.video.volume = volume;
            console.log(settings.video.volume);
        };

        //降低音量
        this.volumeDown = function () {
            var that = this;
            var settings = that.settings;

            //音量减少
            var volume = settings.video.volume;
            volume -= settings.volumeStep;
            if (volume < 0) {
                volume = 0;
            }
            settings.video.volume = volume;
            console.log(settings.video.volume);
        };

        //快进
        this.forward = function () {
            var that = this;
            var settings = that.settings;

            settings.isWard = true;

            //判断当前是否有移动过的滚动条位置
            if (settings.currentWard === -1) {
                settings.currentWard = settings.video.duration * settings.percent;
            }

            settings.currentWard += settings.wardStep;
            //防止超过极限
            if (settings.currentWard >= settings.video.duration) {
                settings.currentWard = settings.video.duration
            }
        };

        //快退
        this.backward = function () {
            var that = this;
            var settings = that.settings;

            settings.isWard = true;

            //判断当前是否有移动过的滚动条位置
            if (settings.currentWard === -1) {
                settings.currentWard = settings.video.duration * settings.percent;
            }

            settings.currentWard -= settings.wardStep;

            if (settings.currentWard <= 0) {
                settings.currentWard = 0;
            }
        };

        //保存快进快退的进度
        this.saveProgress = function () {
            var that = this;
            var settings = that.settings;

            settings.isWard = false;

            settings.video.currentTime = settings.currentWard;

            settings.currentWard = -1;

        };

        this.getCanvas = function () {
            return this.settings.canvas;
        }
    },
    //关闭弹框时，需要对实例化的对象进行一些操作
    closeCanvas: function () {
        var that = this;

        that.action_tool_thumbnail.canvas = null;
        that.action_hot_pic.canvas = null;
        that.action_hot_plane.canvas = null;
        that.action_hot_text.canvas = null;

        if (that.action_hot_video.canvas) {
            //如果关闭的是video弹框
            that.action_hot_video.canvas.settings.video.pause();
            that.action_hot_video.canvas.settings.video.src = '';
            that.action_hot_video.canvas = null;
        }
    },

    //*------------------------------------------------------执行动作---------------------------------------------------------

    //场景热点切换事件
    action_changeScene: function (obj) {
        let that = this;

        //直接调用传过来的方法跳转
        let playerObj = this.playerObj;
        if (playerObj.api_getSceneDataById().sceneId != obj.sceneId) {
            //清空渲染列表
            that.clearAll();

            //通过位置获取x，y，获取pan，tilt，fov
            playerObj.api_changerSceneById(obj.sceneId, obj.pan, 0, 90);
        }
        else {
            //如果切换的场景为当前场景，则不切换

            //playerObj.api_walkThrough(duration, obj.pan, obj.tilt, obj.fov);
        }
    },

    //切换下一个场景的方法
    action_nextScene: function (params, HSObj) {
        let that = this;
        let playerObj = that.playerObj;
        let scenesArr = that.panorama.settings.params.scenesArr;
        //首先获取到当前场景的id
        let sceneId = playerObj.api_getCurSceneId();

        //获取到当前场景的下标
        let index = -1;
        for (let i = 0; i < scenesArr.length; i++) {
            if (sceneId == scenesArr[i].sceneId) {
                index = i;
            }
        }

        //判断当前场景是否是最后一个
        index++;
        if (index >= scenesArr.length) {
            index = 0;
        }

        //将下一个场景的fov修改为90
        scenesArr[index].initFov = 90;

        //清除绘制
        that.clearAll();

        //切换下一个场景
        this.playerObj.api_nextScene();
    },

    //切换上一个场景的方法
    action_prevScene: function (params, HSObj) {
        let that = this;
        let playerObj = that.playerObj;
        let scenesArr = that.panorama.settings.params.scenesArr;
        //首先获取到当前场景的id
        let sceneId = playerObj.api_getCurSceneId();

        //获取到当前场景的下标
        let index = -1;
        for (let i = 0; i < scenesArr.length; i++) {
            if (sceneId == scenesArr[i].sceneId) {
                index = i;
            }
        }

        //判断当前场景是否是最后一个
        index--;
        if (index <= -1) {
            index = scenesArr.length - 1;
        }

        //将上一个场景的fov修改为90
        scenesArr[index].initFov = 90;

        that.clearAll();
        //切换下一个场景
        this.playerObj.api_previousScene();
    },

    //*------------------------------------------------------相关方法---------------------------------------------------------

    //通过名称和panTilt修改当前热点的位置
    updateHotPos(name, pan, tilt){
        for (var key in this.hotSpotList) {
            if(key === name){
                var obj = this.hotSpotList[key];
                obj.position.Pan = pan;
                obj.position.Tilt = tilt;

                //更新矩阵
                obj.mMatrix = this.createFlatMatrix(obj.position);

                //更新位置
                var buffer = this.createFlatBuffer(obj.mMatrix);
                obj.modeJSON = this.webGLBindBuffer(buffer);

            }
        }
    },

    //计算两个点之间的距离的方法
    getRange: function (px1, py1, px2, py2) {
        return Math.sqrt(Math.pow(Math.abs(px1 - px2), 2) + Math.pow(Math.abs(py1 - py2), 2));
    },

    //获取当前场景中心的pan tilt fov
    getCurScenePTF() {
        return this.playerObj.api_getCurScenePTF();
    },

    //球模型坐标转屏幕坐标
    sphereToScreen(pan, tilt) {
        return this.playerObj.api_sphereToScreen(pan, tilt);
    },

    //屏幕坐标转球模型坐标
    screenToSphere(x, y) {
        return this.playerObj.api_screenToSphere(x, y);
    },

    //webgl图像坐标转换成屏幕坐标
    threeToScreen(x, y, z) {
        return this.playerObj.api_3DXYZToScreen(x, y, z);
    },

    //场景pan tilt 转换成场景世界坐标
    panTiltToWorld(pan, tilt) {
        const rY = pan + 90;
        const rX = tilt;
        const mMatrix = mat4['create'](); //单位矩阵

        //todo:这里一定要先旋转 pan  也就是 y轴先转
        mat4['rotateY'](mMatrix, mMatrix, -(rY * Math.PI / 180));
        mat4['rotateX'](mMatrix, mMatrix, (rX * Math.PI / 180));

        //todo:处理平移
        mat4['translate'](mMatrix, mMatrix, [0, 0, -1.0]);

        const p = [0, 0, 0];
        vec3.transformMat4(p, p, mMatrix);

        return p;
    },

    //场景pan tilt 转换成场景世界矩阵
    panTiltToMatrix(pan, tilt) {
        const rY = pan + 90;
        const rX = tilt;
        const mMatrix = mat4['create'](); //单位矩阵

        //todo:这里一定要先旋转 pan  也就是 y轴先转
        mat4['rotateY'](mMatrix, mMatrix, -(rY * Math.PI / 180));
        mat4['rotateX'](mMatrix, mMatrix, (rX * Math.PI / 180));

        //todo:处理平移
        mat4['translate'](mMatrix, mMatrix, [0, 0, -1.0]);

        return mMatrix;
    },

    //屏幕坐标转换成场景世界坐标
    screenToWorld(x, y) {
        const ptf = this.screenToSphere(x, y);
        return this.panTiltToWorld(ptf.pan, ptf.tilt);
    },

    //场景世界坐标转换成屏幕坐标
    worldToScreen(x, y, z) {
        return this.threeToScreen(x, y, z);
    },

    //通过pan和tilt生成一个three.js的plane用来检测使用
    panTiltToPlane(pan, tilt){
        var p = this.panTiltToWorld(pan, tilt);
        var normal = new THREE.Vector3(p[0], p[1], p[2]);
        //获取反向量
        normal.negate();

        //生成平面
        return new THREE.Plane(normal, 1);
    }

};

