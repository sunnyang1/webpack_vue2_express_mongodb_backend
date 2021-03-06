const async = require('async')
const db = require('../../conf/db')
const redis = require('../../conf/redis')

const serviceNotice = (content) => {

	const service = db.get('t_client_service')
		  client = db.get('t_client')
		  user = db.get('t_user')
		  notice = db.get('t_notice')

	// froeach service
	service.find({status: 1}, '-status')
	.then((result) => { //console.log('services', result)

		if( result ){ 

			let users = []
			async.eachSeries(result, function(item, callback){
				var dec = new Date(item.endTime).valueOf() - new Date().valueOf()
				if( dec <= 1000*60*60*24*10 && new Date(item.endTime).valueOf()>new Date().valueOf() ){
					let year = new Date(item.endTime).getFullYear()
					let month = new Date(item.endTime).getMonth()+1
					let day = new Date(item.endTime).getDate()
					// every service's client
					client.findOne({_id: item.clientId}, '-_id')
					.then((result) => {
						if(result){ 
							// 通知客户绑定的用户
							let content = "客户（"+result.name+"）（"+result.adminAccount+"）的服务将于（"+year+"年"+month+"月"+day+"日）到期，请及时提醒客户续费并续接服务，否则将在到期时间关闭服务。"
							users.push({
								user: result.user,
								content: content
							})
							// find user parents
							/*user.findOne({_id: result.user}, '-_id')
							.then((result) => { //console.log('user', result)
								if(result){
									users = users.concat(result.parents)
								}else{
									console.error("服务到期通知——查询客户绑定用户的父级为空")
								}
								callback()
							})
							.catch((error) => {
								console.error("服务到期通知——查询客户绑定用户的父级失败:", error)
							})*/
						}else{
							console.error("服务到期通知——未找到客户")
							callback()
						}
					})
					.catch((error) => {
						console.error("服务到期通知——查询客户出错:", error)
					})
					
					// redis update client service status
					redis.select('1', function(error){
					    if(error){
					        console.error('redis service expired failed:', error);
					    }else{
					        redis.set(item.clientId, 0, function(err, res){  
						        console.log('redis service expired:'+item.clientId, res); 
						    });
					    }
					});
				}else{
					callback()
				}
			},function(err, result){
				// foreach end
				console.info('服务到期通知——服务遍历结束', users)
				if( users.length > 0 ){

					async.eachSeries(users, function(item, cb){
						notice.insert({
							userId: item.user,
							content: item.content,
							haveRead: 0
						})
						.then((result) => {
							if(!result){
								console.error('服务到期通知——消息插入失败')
							}
							cb()
						})
					},function(err, result){
						console.info('消息插入成功')
					})
					
				}else{
					console.info('无到期提醒')
				}
			})

		}else{
			console.error("服务到期通知——服务为空")
		}
		
	})
	.catch((error) => {
		console.error("服务到期通知——遍历服务出错:", error)
	})
}

module.exports = serviceNotice