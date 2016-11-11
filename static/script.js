var cursor;
var flag=0;
var flagAutoAdded=1; //quando video para e musica auto é adicionada, flag==1. Volta a zero quando video muda de estado para ENDED
var automaticMode=1;
var suggestCallBack;
var player;
var myScroll;

$(function(){
    var searchField = $('#query');
    var icon = $('#search-btn');

    $('#search-form').submit(function(e){
        e.preventDefault();
    });

});

function onYouTubeIframeAPIReady() {
    player = new YT.Player('playerContainer', {
        width: '100%',
        height: '100%',
        videoId: '',
        enablejsapi:1,
        playerVars: {
            color: 'white'
        },
        events: {
            onReady: onPlayerReady,
            onStateChange: onPlayerStateChange
        }
    });
}

function onPlayerReady(){
    cursor=0;
    getPlaylistPlayer(function(results){
        if(results.length>0){
            player.loadVideoById(results[0].videoid);
            flag=1;
        }
    });
}

function onPlayerStateChange(event){

    if(event.data == YT.PlayerState.ENDED){
        skipVideo(1);
        getPlaylist();
        flagAutoAdded=0;
    }

    if(event.data == YT.PlayerState.ENDED && $('#containerPlaylist ul li').length == 0){
        flag = 0;
    }
}

function skipVideo(dir){
    if(dir==0){
        getPlaylistPlayer(function(results){
            if(cursor > 0){
                cursor--;
                player.loadVideoById(results[cursor].videoid);
            }else{
                cursor=results.length-1;
                player.loadVideoById(results[cursor].videoid);
            }
        });
    }else{
        getPlaylistPlayer(function(results){
            if(results.length > cursor+1){
                cursor++;
                player.loadVideoById(results[cursor].videoid);
            }
        });
    }
}

function search() {
    $('#results').html('');
    q = $('#query').val();
    $('#search-form')[0].reset();
    document.activeElement.blur();
    $.get(
        "https://www.googleapis.com/youtube/v3/search", {
            part: 'snippet, id',
            q: q,
            maxResults: 20,
            type: 'video',
            videoCategoryId: 10,
            key: 'AIzaSyAyCS7wxWvJB3sG5Qmd2MOpB9J50v-NLaY'
        },
        function(data) {

            for (var i = 0; i < data.items.length; i++) {
                $.get(
                    "https://www.googleapis.com/youtube/v3/videos", {
                        part: 'snippet, contentDetails',
                        key: "AIzaSyAyCS7wxWvJB3sG5Qmd2MOpB9J50v-NLaY",
                        id: data.items[i].id.videoId
                    },
                    function(video) {
                        if (video.items.length > 0) {
                            item = video.items[0];
                            var output = getOutput(video.items[0]);
                            $('#results').append(output);
                        }
                    });
            }
        });

}

function searchRelatedVideos(videoId){
    $.get(
        "https://www.googleapis.com/youtube/v3/search", {
            part: 'snippet, id',
            relatedToVideoId: videoId,
            maxResults: 15,
            type: 'video',
            videoCategoryId: 10,
            key: 'AIzaSyAyCS7wxWvJB3sG5Qmd2MOpB9J50v-NLaY'
        },
        function(data) {
            var i = Math.floor(Math.random() * 12);
                $.get(
                    "https://www.googleapis.com/youtube/v3/videos", {
                        part: 'snippet, contentDetails',
                        key: "AIzaSyAyCS7wxWvJB3sG5Qmd2MOpB9J50v-NLaY",
                        id: data.items[i].id.videoId
                    },
                    function(video) {
                        if (video.items.length > 0) {
                            var juke = $("#jukename ").text();
                            var url = video.items[0].id;
                            var vtitle = video.items[0].snippet.title;
                            var vduration = convertTime(video.items[0].contentDetails.duration);
                            var vcursor = cursor;
                            var vlocation = 0;

                            $.post("/add",{jukename: juke,url: url, videoTitle: vtitle, videoDuration: vduration, location:vlocation, cursor: vcursor},function(data){});
                         }
                    });


        });
}

function convertTime(duration) {
    var a = duration.match(/\d+/g);

    if (duration.indexOf('M') >= 0 && duration.indexOf('H') == -1 && duration.indexOf('S') == -1) {
        a = [0, a[0], 0];
    }

    if (duration.indexOf('H') >= 0 && duration.indexOf('M') == -1) {
        a = [a[0], 0, a[1]];
    }
    if (duration.indexOf('H') >= 0 && duration.indexOf('M') == -1 && duration.indexOf('S') == -1) {
        a = [a[0], 0, 0];
    }

    duration = 0;

    if (a.length == 3) {
        duration = duration + parseInt(a[0]) * 3600;
        duration = duration + parseInt(a[1]) * 60;
        duration = duration + parseInt(a[2]);
    }

    if (a.length == 2) {
        duration = duration + parseInt(a[0]) * 60;
        duration = duration + parseInt(a[1]);
    }

    if (a.length == 1) {
        duration = duration + parseInt(a[0]);
    }
    var h = Math.floor(duration / 3600);
    var m = Math.floor(duration % 3600 / 60);
    var s = Math.floor(duration % 3600 % 60);
    return ((h > 0 ? h + ":" + (m < 10 ? "0" : "") : "") + m + ":" + (s < 10 ? "0" : "") + s);
}

function getPlaylistPlayer(fn){
      var juke = $("#jukename").text();
      $.post("/showPlaylist",{jukename: juke},
          function(data){
              fn(data);
          });
}

function getPlaylist(){
            var juke = $("#jukename").text();
            $.post("/showPlaylist",{jukename: juke},
                function(data){
                    console.log(data);
                    $('#playlist').empty();
                    for (var i = 0; i < data.length; i++) {
                        if (data.length > 0) {
                            item = data[i];
                            var output = displayPlaylist(data[i],i);
                            $('#playlist').append(output);
                        }
                    }
                });
}

function displayPlaylist(item,i){

    var title =item.title;
    var duration=item.duration;
    var videoId = item.videoid;
    var dbid = item.id;

    if (i == cursor) {
        var liTag = '<li id="playlistItem" class = "list-group-item active" video-id= ' + videoId + ' dbId=' + dbid +'index='+i+'>';
    }else{
        var liTag = '<li id="playlistItem" class = "list-group-item" video-id= ' + videoId + ' dbId=' + dbid +'index='+i+'>'
    }



    var output = liTag +
                //'<i id="playPlaylist" class = "material-icons">play_arrow</i>' +
                '<p id="songTitle">'+title+'</p>' +
                '<span class="moveSong">'+
                '<i id="clear" class = "material-icons" dbId='+dbid+'>clear</i>' +
                '<i id="moveUp" class = "material-icons" dbId='+dbid+'>expand_more</i>' +
                '<i id="moveDown" class = "material-icons" dbId='+dbid+'>expand_less</i>' +
                '</span>'+
				'<p id="songDuration">'+duration+'</p>' +
				'</li>' +
				'<div class="clearfix"></div>' +
				'';
    return output;
}

function getOutput(item){

    var videoId = item.id;
    var title = item.snippet.title;
    var description = item.snippet.description;
    var thumb = item.snippet.thumbnails.high.url;
    var duration = convertTime(item.contentDetails.duration);

    var output = '<li class = "search-list" class="addNext" type="button" video-id= '+ videoId +' video-title= '+'"'+title+'"'+' video-duration= '+duration+'>' +
          //      '<div class="list-left">' +
         //       '<img src="'+thumb+'">' +
         //       '</div>' +
				'<div class ="list-right">' +
				'<h5>'+title+'</h5>' +
                '<p>'+duration+'</p>' +
           //     '<div id="buttonsResult" class="buttonsContainer">' +
          //      '<button class="addNext" type="button" video-id= '+ videoId +' video-title= '+'"'+title+'"'+' video-duration= '+duration+' >Add as next</button>' +
        //        '<button class="addEnd "type="button" video-id= '+ videoId +' video-title= '+'"'+title+'"'+' video-duration= '+duration+'>Add to the end</button>' +
                //'</div>' +
				'</div>' +
				'</li>' +
				'<div class="clearfix"></div>' + 
				'';

    return output;

}

function jumpTo(h) {
    var top = document.getElementById(h).offsetTop,
        left = document.getElementById(h).offsetLeft;
    var animator = createAnimator({
        start: [0,0],
        end: [left, top],
        duration: 200
    }, function(vals){
        console.log(arguments);
    	window.scrollTo(vals[0], vals[1]);
    });

    //run
    animator();
}

function createAnimator(config, callback, done) {
    if (typeof config !== "object") throw new TypeError("Arguement config expect an Object");

    var start = config.start,
        mid = $.extend({}, start), //clone object
        math = $.extend({}, start), //precalculate the math
        end = config.end,
        duration = config.duration || 1000,
        startTime, endTime;

    //t*(b-d)/(a-c) + (a*d-b*c)/(a-c);
    function precalculate(a, b, c, d) {
        return [(b - d) / (a - c), (a * d - b * c) / (a - c)];
    }

    function calculate(key, t) {
        return t * math[key][0] + math[key][1];
    }

    function step() {
        var t = Date.now();
        var val = end;
        if (t < endTime) {
            val = mid;
            for (var key in mid) {
                mid[key] = calculate(key, t);
            }
            callback(val);
            requestAnimationFrame(step);
        } else {
            callback(val);
            done && done();
        }
    }

    return function () {
        startTime = Date.now();
        endTime = startTime + duration;

        for (var key in math) {
            math[key] = precalculate(startTime, start[key], endTime, end[key]);
        }

        step();
    }
}



function updateProgressBar(){
    // Update the value of our progress bar accordingly.
    var q = ((player.getCurrentTime()/player.getDuration())*100);
    var prog = q.toString()+"%";
    $('.progress-bar').css("width",prog);
}


function update(){
    var playSize = $('#containerPlaylist ul li').length;
    if(playSize==1 && flag==0){
        getPlaylistPlayer(function(results){
            player.loadVideoById(results[0].videoid);
            flag=1;
        });
    }
    if(player.getPlayerState()==0  && playSize>=1){
        if(automaticMode==1 && (playSize)==(cursor+1) && flagAutoAdded==0){
            flagAutoAdded=1;
            searchRelatedVideos(player.getVideoData()['video_id']);
        }
         skipVideo(1);
    }
    getPlaylist();

    updateProgressBar();

}



$(document).ready(function(){
    getPlaylist();


    $('#results').on("click",'.search-list',function(){
        var juke = $("#jukename ").text();
        var url = $(this).attr("video-id");
        var vtitle = $(this).attr("video-title");
        var vduration = $(this).attr("video-duration");
        var vcursor = cursor;
        var vlocation = 0;

        $.post("/add",{jukename: juke,url: url, videoTitle: vtitle, videoDuration: vduration, location:vlocation, cursor: vcursor},function(data){});
        getPlaylist();

    });

    $('#results').on("click",'.addNext',function(){
        var juke = $("#jukename ").text();
        var url = $(this).attr("video-id");
        var vtitle = $(this).attr("video-title");
        var vduration = $(this).attr("video-duration");

        $.post("/add",{jukename: juke,url: url, videoTitle: vtitle, videoDuration: vduration, location:1, cursor: cursor},function(data){});
        getPlaylist();
    });

    $('#playlist').on("click",'#moveDown',function() {
        var juke = $("#jukename").text();
        var id = $(this).attr("dbId");
        $.post("/reorder",{jukename: juke, id: id, direction:0},function(data){});
        cursor--;
        getPlaylist();

    });

    $('#playlist').on("click",'#moveUp',function() {
        var juke = $("#jukename").text();
        var id = $(this).attr("dbId");
        $.post("/reorder",{jukename: juke, id: id, direction:1},function(data){});
        cursor++;
        getPlaylist();
    });

    $('#playlist').on("click",'#clear',function() {
        var juke = $("#jukename").text();
        var id = $(this).attr("dbId");
        if(cursor+1==$('#containerPlaylist ul li').length){
            $.post("/delete",{jukename: juke, id: id},function(data){});
            cursor--;
            flag=0;
            getPlaylist();
        }else{
            $.post("/delete",{jukename: juke, id: id},function(data){});
            getPlaylistPlayer(function(results){
                player.loadVideoById(results[cursor].videoid);
                flag=1;
            getPlaylist();
        });
        }
    });


    $('#playbackControl').on("click",'#skipPrevious',function(){
        skipVideo(0);
        getPlaylist();
    });

    $('#playbackControl').on("click",'#skipNext',function(){
        skipVideo(1);
        getPlaylist();
    });

    $('#search-form').submit(function() {
        search();
    });


    $('#playbackControl').on("click",'#play',function(){
        player.playVideo();
    });

    $('#playbackControl').on("click",'#pause',function(){
        player.pauseVideo();
    });

    $("[name='autoSwitch']").bootstrapSwitch('size', 'mini');


    $('input[name="autoSwitch"]').on('switchChange.bootstrapSwitch', function(event, state) {
        if(automaticMode==1){
             automaticMode=0;
        }else{
            automaticMode=1;
        }
     });


    $("#query").autocomplete({
        source: function(request, response) {
            $.getJSON("http://suggestqueries.google.com/complete/search?callback=?",
                {
                  "hl":"en", // Language
                  "ds":"yt", // Restrict lookup to youtube
                  "jsonp":"suggestCallBack", // jsonp callback function name
                  "q":request.term, // query term
                  "client":"youtube" // force youtube style response, i.e. jsonp
                }
            );
            suggestCallBack = function (data) {

                var suggestions = [];
                $.each(data[1], function(key, val) {
                    suggestions.push({"value":val[0]});
                });
                suggestions.length = 5; // prune suggestions list to only 5 items
                response(suggestions);
            };
        },
        select: function (e, ui) {
            $("#query").val(ui.item.value);
            $("#search-form").submit();
            e.preventDefault();
        }
    });


  setInterval(function(){
    update();
  },1000);



 });










