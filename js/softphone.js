(function (root, factory) {
	Window.Micc = factory();
}(this, function () {

	function Micc(Server) {
		this.miccServer = Server; //Mitel部署的服务器地址
		this.miccSdk = this.miccServer + '/MiccSdk/api/v1';
		this.miccAuth = this.miccServer + '/authorizationserver';

		this.bearToken = null;
		this.access_token = null;
		this.EventName = null; //事件名称

		this.agentId = null; //座席號
		this.ext = null; //分機號
		this.conversationId = null; //会话标识(通话的唯一标识)
		this.reason = null; //小休原因
		this.agentState = null; //座席狀態
		this.voiceState = null; //
		this.acdState = null; //分机状态
		this.conversationState = null; //會話狀態
		this.sessionArr = new Array();

		this.ani = null; //主叫
		this.dnis = null; //被叫
		this.version = '2018-11-05'

		$phone = this;

	}
	window.$phone = null;
	Micc.prototype.init = function () {
		var Action = {
			unk: '0', //Unknow
			Ava: '1', //Available
			busy: '2', //Busy
			dnd: '3', //DoNotDisturb
			away: '4', //Away,
			off: '5', //Offline

			answer: '1', //Accept
			hold: '5', //Hold
			recover: '6', //RemoveHold
			trans: '7', //Transfer
			drop: '9' //End
		}
		$('#answer').click(function () {
			$phone.dnis = $('#num').val();
			var req = {
				conversationAction: Action.answer,
				id: $phone.conversationId
			};
			if ($(this).hasClass('enable')) {
				$phone.conversationAction(req);
			}

		});
		$('#end').click(function () {
			var req = {
				conversationAction: 'End'
			};

			if ($(this).hasClass('enable')) {
				$phone.conversationAction(req);
			}
		});

		$('#checkIn').click(function () {
			console.log('签入');

			if ($(this).hasClass('enable')) {
				$phone.setAvailable();
			}

		});
		$('#busy').click(function () {
			if ($(this).hasClass('enable')) {
				$phone.setBusy();
			}
		});
		$('#logout').click(function () {

			if ($(this).hasClass('enable')) {
				$phone.setOffline();
			}

		});
		$('#login').click(function () {
			$phone.agentId = $('#agentId').val();
			$phone.ext = $('#ext').val();
			$phone.pwd = $('#pwd').val();
			console.log('AgentID:', $phone.agentId, 'Password:', $phone.pwd)
			console.log($phone.agentId, $phone.pwd, $phone.ext)
			$phone.login($phone.agentId, $phone.pwd, function (data) {
				console.log('登錄成功！')
				$phone.bearToken = data.access_token;
				data.miccServer = $phone.miccServer;
				$phone.connectToEmployeeHub(data)
			});

		});
		$phone.Initui();
	}
	/**API */
	// 登錄
	Micc.prototype.login = function (agentId, password, callback) {
		console.log('用户[%s]登录在[%s]', agentId, this.miccAuth);
		var data = "grant_type=password&username=" + agentId + "&password=" + password;
		var header = {
			"Content-Type": "application/x-www-form-urlencoded"
		}

		var opts = {
			data: data,
			method: 'POST',
			url: this.miccAuth + "/token",
			headers: header
		};
		console.log(opts);
		$.ajax(opts).done(
			function (res) {
				console.log('登录成功！响应数据:', res);
				$phone.bearToken = res.access_token;
				res.miccServer = $phone.miccServer;
				if (callback) {

					callback(res);
				}
			}).then(function () {
				$phone.loginExtension($phone.ext);
				$phone.setBusy();
			});

	}
	// 獲取座席狀態
	Micc.prototype.getEmployeeState = function (callback) {

		var opts = {
			method: 'GET',
			url: "employees/me/state"
		};
		console.log(opts.url);

		this.sendAjax(opts, callback);
	};
	// 獲取示忙原因
	Micc.prototype.getEmployeeBusyReason = function (callback) {
		opts = {
			method: 'GET',
			url: 'employees/me/busyreasoncodes'
		};
		this.sendAjax(opts, callback);

	};
	// 設置座席狀態
	Micc.prototype.setEmployeeState = function (payload, callback) {
		var data = JSON.stringify(payload);
		console.log('data', data)
		opts = {
			data: data,
			method: 'PUT',
			url: 'employees/me/state'
		};
		this.sendAjax(opts, callback);

	};
	// 獲取活動會話
	Micc.prototype.getActiveConversation = function (callback) {
		var data = {
			type: "active",
			refreshMonitors: true
		}
		opts = {
			data: data,
			method: 'GET',
			url: 'employees/me/conversations'
		};
		this.sendAjax(opts, callback);
	}
	// 獲取當前會話信息
	Micc.prototype.getCurrentConversation = function () {
		$phone.getActiveConversation(function (data) {
			console.log('当前通话：', data)
		})
	}
	// 會話操作
	Micc.prototype.conversationAction = function (payload, callback) {
		var data = JSON.stringify(payload);
		console.log(data)
		opts = {
			data: data,
			method: 'PUT',
			url: 'employees/me/conversations/' + $phone.conversationId

		};
		this.sendAjax(opts, callback);
	};
	// 撥號
	Micc.prototype.postEmployeeConversation = function (payload, callback) {
		var data = JSON.stringify(payload);

		opts = {
			data: data || {},
			method: 'POST',
			url: "employees/me/conversations"
		};
		this.sendAjax(opts, callback);
	};
	// 建立長連接
	Micc.prototype.connectToEmployeeHub = function (data) {
		// 獲取座席狀態
		$phone.getEmployeeState(function (data) {
			$phone.employeeInfo(data)
			console.log(data)
		})
		// 獲取電話通話狀態
		$phone.getConversationState(function () {
			$phone.monitorEventChange()
		})
		//  Get Reason list
		$phone.getEmployeeBusyReason($phone.busyReasonCodes)
		var connection = $.hubConnection(data.miccServer + '/miccsdk/', {
			qs: 'sessionid=Bearer ' + data.access_token
		});

		$phone.getCurrentConversation();
		connection.logging = true;
		connection.error(function (error) {
			console.error('Connection error:  ', error);
		});
		connection.stateChanged(function (state) {
			console.info('连接状态改变:  ', state);
		});

		connection.start().done(function () {
			console.info('Connection established with ID=' + connection.id);

			var hub = connection.createHubProxy('employeeHub');
			hub.invoke('addSelfMonitor');
			hub.on('EmployeeStateChanged', $phone.employeeInfo);
			hub.on('employeeConversationChanged', $phone.EmployeeConversationChanged);
			hub.on('employeeConversationRemoved', $phone.EmployeeConversationRemoved);
		}).fail(function () {
			console.error('Connection failed');
		});
	}
	// 會話狀態變化監聽
	Micc.prototype.EmployeeConversationChanged = function (conversations) {
		var data = conversations[0];
		$phone.conversationId = data.conversationId;
		$phone.ani = data.fromAddress;
		$phone.conversationState = data.conversationState;
		console.info('Received EmployeeConversationChange:', conversations)
		console.log(data.conversationState);
		console.log('AgentEvent:', data.conversationState)
		// UI change Event
		$phone.changeUI($phone.conversationState);
	}
	// 獲取會話信息
	Micc.prototype.getConversationState = function (callback) {
		var data = null;
		opts = {
			data: data,
			method: 'GET',
			url: 'employees/me/conversations'
		};
		this.sendAjax(opts, callback);

	}
	// 結束會話
	Micc.prototype.EmployeeConversationRemoved = function (conversationId) {

	}
	// 座席信息
	Micc.prototype.employeeInfo = function (data) {
		console.log('坐席信息', data);
		console.log(JSON.stringify(data));
		$phone.stateProcess(data.presence)
	}

	// 坐席组状态
	Micc.prototype.stateProcess = function (presence) {
		console.log(presence)
		$phone.agentState = presence.aggregate.state; //座席狀態
		$phone.voiceState = presence.voice[0].state; //分機狀態
		$phone.acdState = presence.voice[0].acdState;
		// $phone.changeUI($phone.agentState)
		console.log('AgentState:', $phone.agentState)
	}
	// 設置小休
	Micc.prototype.setPresence = function (state, reasonCode, event) {
		console.log(state, reasonCode, event)
	}
	// 加载示忙原因
	Micc.prototype.busyReasonCodes = function (data) {
		var reasonItem = data._embedded.items;
		for (var reason of reasonItem) {
			console.log('Reason:', reason);
		}
	}
	// 签入分机
	Micc.prototype.loginExtension = function (ext) {

		var req = {
			availableReason: 'Login',
			hotDeskBaseExtension: ext,
			hotDeskPin: "",
			state: 'Available'
		}
		$phone.setEmployeeState(req, function (data) {
			console.log(data)
		})
	}

	// 彈屏方法可寫在此處
	Micc.prototype.Alert = function () {
		/** */
		$phone.sessionArr.push($phone.conversationId);
		var len = $phone.sessionArr.length;
		if (len == 1) {
			$phone.ani = $phone.matchNumber($phone.ani);
			var url = 'http://10.154.91.50:8080/incident/smartit/dialog?ANI=' + $phone.ani + '&conversationId=' + $phone.conversationId
			// test url
			// var testUrl = "http://10.154.91.50:8080/incident/smartit/dialog?ANI=15270897323" + '&conversationId=' + $phone.conversationId
			window.open(url);
			console.log('%c' + 'ANI:' + $phone.ani + ';----CallID:' + $phone.conversationId, 'background:#ff7680;color:#fff');
		}

	}
	// 監聽會話改變
	Micc.prototype.monitorEventChange = function (res) {
		console.log(res)
		/* var isItems = res._embedded.items;
	
		for (var i = 0; i < isItems.length; i++) {
			var mediaType = isItems[i].mediaType;
			if (mediaType == 'Voice') {
				ConversationState = isItems[i].conversationState;
				ConversationId = isItems[i].conversationId;
				$phone.changeUI(ConversationState);
				console.log(ConversationState);
				console.log(ConversationId)
			}
		} */
	}
	/**
	 * 0 - Unknow
	 * 1 - Available
	 * 2 - Busy
	 * 3 - DND 
	 * 4 - Away
	 * 5 - Offline
	 */
	// 設置就緒
	Micc.prototype.setAvailable = function () {
		var payload = {
			state: 1
		}
		$phone.setEmployeeState(payload, function (data) {
			console.log('setAvailable:', data);
			$phone.changeUI('Available');

		})
	}
	// 設置示忙
	Micc.prototype.setBusy = function () {
		var payload = {
			state: 2
		}
		$phone.setEmployeeState(payload, function (data) {
			console.log('setBusy:', data);
			$phone.changeUI('login');
		})
	};
	//登出
	Micc.prototype.setOffline = function () {
		var payload = {
			state: 5
		}
		$phone.setEmployeeState(payload, function (data) {
			console.log('setOffline:', data);
			window.location.reload();
			// $phone.changeUI('Offline');
		})
	};
	Micc.prototype.sendAjax = function (opts, callback) {
		var url = this.miccSdk + '/' + opts.url;
		var headers = {
			Authorization: 'Bearer ' + this.bearToken,
			'content-type': 'application/json'
		};
		var options = {
			type: opts.method,
			url: url,
			data: opts.data || '',
			headers: headers
		};
		$.ajax(options, callback).done(function (res) {
			console.log('响应数据：', res);
			// 頁面展示信息，如不需要可刪除或註釋
			$('#eventInfo').append("<pre>" + JSON.stringify(res) + "</pre>")
			if (callback) {
				callback(res);
			}
		})
	}

	/* UI 狀態圖標切換*/
	// 初始化按鈕組
	Micc.prototype.Initui = function () {
		$phone.unableBtn('answer', 'end', 'checkIn', 'busy', 'checkOut', 'logout', 'answer')
		$phone.enableBtn('login')
	}
	// 通話
	Micc.prototype.Connectionui = function () {
		$phone.unableBtn('login', 'checkIn', 'busy', 'checkOut', 'logout', 'answer')
		$phone.enableBtn('end')
	}
	// 來電振鈴
	Micc.prototype.Ringingui = function () {
		$phone.unableBtn('end', 'login', 'checkIn', 'busy', 'checkOut', 'logout', 'answer')
		$phone.enableBtn('answer', 'end')
	}
	// 掛斷 
	Micc.prototype.Endui = function () {
		$phone.unableBtn('answer', 'end', 'checkIn', 'login', 'checkOut', 'logout', 'answer')
		$phone.enableBtn('busy')
	}

	// 簽入
	Micc.prototype.Loginui = function () {
		$phone.unableBtn('answer', 'end', 'login', 'busy', 'checkOut', 'answer')
		$phone.enableBtn('checkIn', 'logout')
	}
	// 就緒等待
	Micc.prototype.Idleui = function () {
		$phone.unableBtn('answer', 'end', 'login', 'busy', 'checkIn', 'answer')
		$phone.enableBtn('checkOut', 'busy', 'logout')
	}
	//示忙
	Micc.prototype.Busyui = function () {
		$phone.unableBtn('answer', 'end', 'login', 'busy', 'checkOut', 'answer')
		$phone.enableBtn('checkIn', 'logout')
	}
	Micc.prototype.enableBtn = function (id) {
		$.each(arguments, function (i, v) {
			$('#' + v).removeClass('unable').addClass('enable').removeAttr('disabled');
		})
	}
	Micc.prototype.unableBtn = function () {
		$.each(arguments, function (i, v) {
			$('#' + v).removeClass('enable').addClass('unable').attr('disabled', 'disable');
		})
	}

	Micc.prototype.changeUI = function (eventName) {
		switch (eventName) {
			case 'Offered':
				{
					$phone.Ringingui();
					$phone.Alert();
				} //来电振铃
				break;
			case 'NonAcd':
				$phone.Connectionui(); //通话
				break;
			case 'Acd':
				$phone.Connectionui() //通话
				break;
			case 'Outbound': //外呼
				break;
			case 'Held': //保持
				break;
			case 'Available':
				$phone.Idleui(); //可用
				break;
			case 'Busy':
				$phone.Busyui(); //示忙
				break;
			case 'DoNotDisturb': //勿扰
				break;
			case 'Offline':
				// $phone.Busyui();
				$phone.Initui();
				$phone.sessionArr.length = 0; //离线
				break;
			case 'Idle':
				$phone.Idleui();
				break;
			case 'Ended':
				$phone.Endui();
				$phone.sessionArr.length = 0;
				break;
			case 'Abandoned':
				$phone.Endui();
				$phone.sessionArr.length = 0;
				break;
			case 'login':
				$phone.Loginui();
				break;
			default:
				break;
		}
	}
	Micc.prototype.showState = function (state) {
		$('#state').text(state);
		console.log(state)
	}
	// 去手機號規則，外地手機號呼入手機號需要去掉零
	Micc.prototype.matchNumber = function (n) {
		var first = n.substr(0, 1);
		var thrid = n.substr(0, 3);
		var reg = /^1[34578]\d{9}$/;
		if (first == '0' && thrid !== '010') {
			n = n.substr(1);
			return n.match(reg)[0];
		} else {
			return n;
		}
	}
	return Micc;
}))