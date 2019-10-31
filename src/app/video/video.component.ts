import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ToastService } from 'ng-zorro-antd-mobile';

declare var TRTC;
@Component({
  selector: 'app-video',
  templateUrl: './video.component.html',
  styleUrls: ['./video.component.css']
})
export class VideoComponent implements OnInit {

  //本地流加入房间
  joinRoom = false;
  //连接成功
  connection = 0;
  remote = false;
  time = '00:00:00';
  sdkAppId = 1400274983;
  userId = '002';
  userSig = "eJyrVgrxCdYrSy1SslIy0jNQ0gHzM1NS80oy0zLBwgYGRlDh4pTsxIKCzBQlK0MToKi5iaWFMUSmJDM3FShqam5kYmFubGkIEU2tKMgsAoqbGZhYGBhAzchMB5qZmFPmXxSY5OJqbFBomZealJ3vm5hanp2VWmli6JkWmZNk5JefH*KcYRiRbqtUCwASYDBh";
  roomId_ = 998899;
  client;
  localStream;
  remoteStreams_;

  isJoined_ = false;
  isPublished_ = false;
  rtc = null;
  // animating = false;
  // animating2 = false;
  constructor(private router: Router, private _toast: ToastService) { }

  ngOnInit() {
    TRTC.checkSystemRequirements().then((result) => {
      if (!result) {
        alert('您的浏览器不支持TRTC');
      }
    });



  }
  ngAfterViewInit(): void {
    //Called after ngAfterContentInit when the component's view has been initialized. Applies to components only.
    //Add 'implements AfterViewInit' to the class.
    this.join();
  }
  //加入房间
  async join() {
    console.log("Join")
    //创建客户端对象
    this.client = TRTC.createClient({
      sdkAppId: this.sdkAppId,
      userSig: this.userSig,
      userId: this.userId,
      mode: 'videoCall'
    });

    //监听客户端事件
    this.listenRemoteStream();


    try {
      await this.client.join({ roomId: 889988 })
      console.log("加入房间成功！");
    } catch (error) {
      console.log("加入房间失败！");
      console.log(error);
      return;
    }

    try {
      this.localStream = TRTC.createStream({ userId: this.userId, audio: true, video: true });
      // 设置视频分辨率帧率和码率
      this.localStream.setVideoProfile('480p');
      console.log("采集摄像头设备成功！")

      await this.localStream.initialize();
      this.joinRoom = true;
      console.log('初始化本地流成功');
    } catch (error) {
      console.log("采集摄像头设备失败！")
      try {
        this.localStream = TRTC.createStream({ userId: this.userId, audio: true, video: true });
        // 设置视频分辨率帧率和码率
        this.localStream.setVideoProfile('480p');
        await this.localStream.initialize();
        this.joinRoom = true;
        console.log('初始化本地流成功');
        console.log("采集摄像头设备成功！")
      } catch (error) {
        console.log("采集摄像头设备失败！")
        return;
      }
    }


    this.localStream.on('player-state-changed', event => {
      console.log(`local stream ${event.type} player is ${event.state}`);
      if (event.type === 'video' && event.state === 'PLAYING') {
        // dismiss the remote user UI placeholder
      } else if (event.type === 'video' && event.state === 'STOPPPED') {
        // show the remote user UI placeholder
      }
    });


    try {
      await this.localStream.play('localStream');
      console.log("播放成功");
      this.connection = 1;
    } catch (error) {
      console.log("播放失败");
      console.log(error);
      return;
    }


    // this.client
    //   .join({ roomId: 889988 })
    //   .then(() => {
    //     console.log('进房成功');
    //     this.localStream = TRTC.createStream({ userId: this.userId, audio: true, video: true });
    //     // 设置视频分辨率帧率和码率
    //     this.localStream.setVideoProfile('480p');
    //     this.localStream
    //       .initialize()
    //       .then(() => {
    //         console.log('初始化本地流成功');
    //         this.joinRoom = true;

    //         this.localStream.play('videoClient', { objectFit: 'cover', muted: true })
    //           .then(res => {
    //             this._toast.info('连接成功！', 4000, null, false);
    //             console.log("播放成功")
    //             this.connection = 1;
    //           }).catch(err => {
    //             console.log("播放失败")
    //           });
    //       }).catch(error => {
    //         this._toast.info('获取设备信息失败！', 4000, null, false);
    //         console.error('初始化本地流失败 ' + error);
    //       });
    //   }).catch(error => {
    //     console.error('进房失败 ' + error);
    //   });
  }

  //发布本地流
  async publish() {
    await this.client
      .publish(this.localStream)
      .then(() => {
        console.log('本地流发布成功');
        this.connection = 2;
      
      }).catch(error => {
        console.error('本地流发布失败 ' + error);
      });

  }

  //监听远端流 
  listenRemoteStream() {
    //客户端错误
    this.client.on('error', err => {
      this._toast.info('客户端错误！请退出当前页重新进入！', 4000, null, false);
      // location.reload();
    });

    //远端用户进房通知- 仅限主动推流用户
    this.client.on('peer-join', event => {
      const userId = event.userId;
      this._toast.info('远端用户进房通知', 4000, null, false);
    });
    // 远端用户退房通知 - 仅限主动推流用户
    this.client.on('peer-leave', evt => {
      const userId = evt.userId;
      this._toast.info('远端用户退房', 4000, null, false);
    });

    //远端流加入 事件
    this.client.on('stream-added', event => {
      console.log("远端流加入")
      this._toast.info('远端流加入', 4000, null, false);
      this.client
        .publish(this.localStream)
        .then(() => {
          console.log('本地流发布成功');
          this.connection = 2;
         
          console.log("订阅远端流")
          const remoteStream = event.stream;
          // 若需要观看该远端流，则需要订阅它
          this.client.subscribe(remoteStream);
        }).catch(error => {
          console.error('本地流发布失败 ' + error);
        });//发布本地流

    });

    // 远端流订阅成功事件--- 播放远端流
    this.client.on('stream-subscribed', event => {
      this.remote = true;
      const remoteStream = event.stream;
      // 远端流订阅成功，在HTML页面中创建一个<video>标签，假设该标签ID为‘remote-video-view’
      // 播放该远端流
      console.log("播放该远端流")
      remoteStream.play("remoteStream", { objectFit: 'cover', muted: true });
    });


    // 远端流关闭 事件
    this.client.on('stream-removed', event => {
      const remoteStream = event.stream;
      // 停止播放并删除相应<video>标签
      remoteStream.stop();
      remoteStream.close();
      this.remote = false;
      this.leave();
    });


    // 远端流音频或视频mute状态通知
    // 远端用户禁用音频通知
    this.client.on('mute-audio', evt => {
      console.log(evt.userId + ' mute audio');
    });
    //远端用户启用音频通知
    this.client.on('unmute-audio', evt => {
      console.log(evt.userId + ' unmute audio');
    });
    //远端用户禁用视频通知
    this.client.on('mute-video', evt => {
      console.log(evt.userId + ' mute video');
    });
    //远端用户启用视频通知
    this.client.on('unmute-video', evt => {
      console.log(evt.userId + ' unmute video');
    });
  }

  //关闭摄像头
  closeCamera() {
    this.localStream.muteVideo();
  }

  async exitRoom() {
    if (this.connection == 2) {
      try {
        await this.unpublish();
        console.log("停止本地流成功");
      } catch (error) {
        console.log("停止本地流失败");
        console.log(error)
      }
    }
    // 8.退出音视频通话房间
    try {
      await this.client.leave().then(() => {
        this._toast.info('退出房间成功！', 4000, null, false);
      })
    } catch (error) {
      this._toast.info('退出房间失败！', 4000, null, false);
      console.log(error);
    } finally {
      this.localStream.stop();
      this.localStream.close();//关闭摄像头
      this.localStream = null;
    }
  }
  //退出房间
  leave() {
    console.log(this.connection);
    if (this.connection != 0) {
      this.exitRoom();
    }
    this.router.navigate(['/home']);
  }

  //退出本地流
  unpublish() {
    // 7.取消发布本地流
    this.client.unpublish(this.localStream).then(() => {
      this._toast.info('取消发布本地流成功！', 4000, null, false);
    }).catch((e) => {
      this._toast.info('取消发布本地流失败！', 4000, null, false);
    });
  }

  ngOnDestroy(): void {
    //Called once, before the instance is destroyed.
    //Add 'implements OnDestroy' to the class.
    this.exitRoom();
  }

}
