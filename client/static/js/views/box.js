(function() {

	// private variables
	var _socket, $chatInput, $chatLog, _room, _userId, _queue;

	SOAPBOX.initBox = function(options) {

		// initialize the box here...
		console.log('box', options);
		//TODO do some check if here if they go straight here without logging in?

		_userId = localStorage.getItem('userId');
		if(_userId) {
			SOAPBOX.initSocket();
			SOAPBOX.initChat();
			SOAPBOX.initWebRTC();
		} else {
			//TODO
			alert('must sign in on homepage');
		}
	};

	SOAPBOX.initSocket = function() {
		_socket = io.connect('http://' + SOAPBOX.baseUrl);
		$chatInput = $('#chatInput');
		$chatLog = $('#chatLog');

		SOAPBOX.setupSocketListeners();
		if (!_room) {
			//hard code 1 room for now
			_room = 'nko';
			_socket.emit('join', {room: _room, id: _userId });
		}
		// window._socket = _socket;
	};

	SOAPBOX.setupSocketListeners = function() {
		_socket.on('newUser', function (data){
			console.log('new soapboxer: ' + data.id);
		});

		_socket.on('join', function (queue) {
			console.log('queue: ', queue);
			_queue = queue;

			//you are broadcaster
			if(_queue[0] === _userId) {
				SOAPBOX.startBroadcast();
			} else {
				SOAPBOX.getStreamFrom(_queue[0]);
			}
			// SOAPBOX.initStream();
			//SOAPBOX.initStream(users[0]);
		});

		_socket.on('newUser', function (id) {
			//add the new user if it is not you to the local queue
			if(id !== _userId) {
				_queue.push(_userId);
			}
		});
	};

	SOAPBOX.initChat = function() {

		// chat message
		_socket.on('sendChatMessageToAll', function(data) {
			if (data.gameId === 'gameId') {
				// $chatLog.append('<p><span class="playerTwo">' + data.user + ':</span> ' + data.message + '</p>');
				$chatLog.append('<p><span class="playerOne">[PLAYER 2]:</span> ' + data.message + '</p>');
				$chatLog.scrollTop($chatLog[0].scrollHeight);
			}
		});

		$chatInput.on('keyup', function(event) {
			var code = (event.keyCode ? event.keyCode : event.which);
			var inputValue;

			// console.log(code);

			// Enter keycode
			if (code == 13) {
				inputValue = $chatInput.val();
				$chatInput.val('');
				// $chatLog.append('<p><span class="playerOne">' + user + ':</span> ' + inputValue + '</p>');
				$chatLog.append('<p><span class="playerOne">[PLAYER 1]:</span> ' + inputValue + '</p>');
				// console.log(_socket.broadcast);
				$chatLog.scrollTop($chatLog[0].scrollHeight);
				// _socket.emit('sendChatMessage', {
				// 	user: user,
				// 	gameId: gameId,
				// 	message: inputValue
				// });
				_socket.emit('sendChatMessage', {
					user: 'user',
					gameId: 'gameId',
					message: inputValue
				});
			}
		});

	};

	SOAPBOX.initWebRTC = function() {

		SOAPBOX.serverRTC = holla.createClient({
			// video: true,
			// audio: false,
			// debug: true,
			presence: true
		});

		SOAPBOX.serverRTC.on("presence", function(user) {
			if (user.online) {
				console.log(user.name + " is online.");
			} else {
				console.log(user.name + " is offline.");
			}
		});

		var name = localStorage.getItem('email');
		$(".me").show();
		$(".them").show();
		$("#whoAmI").remove();
		$("#whoCall").show();
		$("#hangup").show();

		holla.createStream({ video: true, audio: true }, function(err, stream) {
			if (err) throw err;
			holla.pipe(stream, $(".me"));

			// accept inbound
			SOAPBOX.serverRTC.register(name, function(worked) {
				SOAPBOX.serverRTC.on("call", function(call) {
					console.log("Inbound call", call);

					call.addStream(stream);
					call.answer();

					call.ready(function(stream) {
						holla.pipe(stream, $(".them"));
					});
					call.on("hangup", function() {
						$(".them").attr('src', '');
					});
					$("#hangup").click(function() {
						call.end();
					});
				});

				// place outbound
				$("#whoCall").change(function() {
					var toCall = $("#whoCall").val();
					var call = SOAPBOX.serverRTC.call(toCall);
					call.addStream(stream);
					call.ready(function(stream) {
						holla.pipe(stream, $(".them"));
					});
					call.on("hangup", function() {
						$(".them").attr('src', '');
					});
					$("#hangup").click(function() {
						call.end();
					});
				});

			});
		});

	};

	SOAPBOX.startBroadcast = function() {
		console.log('broadcast my stream');
	};

	SOAPBOX.getStreamFrom = function(user) {
		console.log('get stream from current speaker');
	};

})();