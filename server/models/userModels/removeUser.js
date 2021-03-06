const db = require('../../conf/db')

const removeUser = (req, callback) => {

	const id = req.body.id;
	const creator = req.session.user._id;
	const users = db.get('t_user');
	if( !id ){
		callback({
			status: 0,
			msg: '参数错误'
		})
		return;
	}
	users.findOne({_id: id}, '-_id')
	.then((result)=>{
		if( result ){
			if( result.parents.indexOf(creator)>=0 ){
				// 父级代理，有权删除
				result.flag = 0;
				users.update({_id: id}, result).then((result)=>{
					if( result ){
						callback({
							status: 1,
							msg: 'success'
						})
					}else{
						callback({
							status: 0,
							msg: '删除失败'
						})
					}
				}).then(() => db.close())
			}else{
				callback({
					status: 0,
					msg: '没有权限'
				})
			}
		}else{
			callback({
				status: 0,
				msg: "未找到用户"
			})
		}
	})
	.catch((error)=>{
		callback({
			status: 0,
			msg: error
		})
	})
}

module.exports = removeUser