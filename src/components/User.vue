<template>
    <div class="user" v-show="showUser">
        <div class="contents">
            <div class="layout-content-main">
            	<div class="user-option options">
            		<Button type="info" @click="newUser = true">新增用户</Button>
            		<div class="search">
            			<span class="span">按照</span>
	            		<Select v-model="searchmode" style="width:100px">
					        <Option v-for="item in searchtype" :value="item.value" :key="item">{{ item.label }}</Option>
					    </Select>
					    <Input v-show="searchmode!=='time'" v-model="search" placeholder="请输入搜索词" style="width:150px"></Input>
					    <Date-picker v-show="searchmode === 'time'" :editable="false"
					    v-model="daterange" format="yyyy/MM/dd" type="daterange" placement="bottom-end" placeholder="选择日期" style="width: 200px;margin-right:10px"></Date-picker>
					    <Button @click="dosearch()">查询</Button>
					    <Button class="clear-search" type="dashed" icon="ios-close-outline" @click="clearSearch()"
					    v-show="users.length!=userArr.length">清除</Button>
            		</div>
            	</div>
            	<div class="user-lists">
            		<table class="mytable">
            			<thead>
            				<tr>
            					<td>用户名</td>
            					<td>账号</td>
            					<td>角色</td>
            					<td class="optiontr">操作</td>
            				</tr>
            			</thead>
            			<tbody>
            				<tr v-for="(user,index) in users"
            				v-if="index>=(pageCurrent-1)*pageSize && index<pageCurrent*pageSize && user._id!=userInfo">
            					<td>{{user.name}}</td>
            					<td>{{user.account}}</td>
            					<td>
            						<template v-for="role in user.roles">
            							<template v-for="item in roles">
            								<Tag v-if="item._id == role">{{item.name}}</Tag>
            							</template>
            						</template>
            					</td>
            					<td>
            						<Button type="info" @click.stop="doedit(user._id)">编辑</Button>
            						<Button type="error" @click.stop="remove(user._id)">删除</Button>
            					</td>
            				</tr>
            			</tbody>
            		</table>
            		<p class="notip" v-show="users.length==0">没有找到您搜索的用户~</p>
            	</div>
            	<Spin fix v-show="loading">
	                <Icon type="load-c" size=36 class="demo-spin-icon-load"></Icon>
	            </Spin>
            	<div class="paginator">
        			<Page 
        			:total="users.length" 
        			:page-size="pageSize" 
        			:current="pageCurrent" 
        			@on-change="changepage"
        			show-elevator></Page>
        		</div>
            	<!-- <pre>{{users}}</pre> -->
            </div>
        </div>
        <Modal @on-ok="submit" @on-cancel="cancel"
	        :title="modalTitle"
	        v-model="newUser"
	        :mask-closable="false">
	        <p>
	        	<span class="input-label">用户名</span>
	        	<Input v-model="name" :maxlength="15" placeholder="请输入用户名" style="width: 250px"></Input>
	        </p>
	        <p>
	        	<span class="input-label">账号</span>
	        	<Input v-model="account" :maxlength="11" placeholder="请输入账号" style="width: 250px" :disabled="edit?true:false"></Input>
	        </p>
	        <p>
	        	<span class="input-label">密码</span>
	        	<Input type="password" :maxlength="20" v-model="pwd" placeholder="请输入密码" style="width: 250px"></Input>
	        </p>
	        <p>
	        	<span class="input-label">角色</span>
		        <Select v-model="selectRole" multiple filterable style="width:250px">
			    	<Option v-for="item in roles" :value="item._id" :key="item" v-if="item.name!='超级管理员'">{{ item.name }}</Option>
			    </Select>
	        </p>
	        <div slot="footer">
	            <Button @click="cancel()">取消</Button>
	            <Button type="success" @click="submit()">确认</Button>
	        </div>   
	    </Modal>
    </div>
</template>

<script>
export default {
	name: 'user',
	data(){
		return{
			loading: true,
			newUser: false,
			modalTitle: "新增用户",
			name: '',
			account: '',
			pwd: '',
			selectRole: [],
			roles: [],
			users: [],
			userArr: [],
			clients: [],
			edit: null,
			searchmode:'name',
			searchtype:[{
				label: '用户名称',
				value: 'name'
			},{
				label: '上级用户名',
				value: 'parent'
			},{
				label: '拥有企业名',
				value: 'client'
			},{
				label: '创建时间段',
				value: 'time'
			}],
			search:'',
			daterange: null,
			pageSize: 10,
			pageCurrent: 1
		}
	},
	methods:{
		getRoles(){
			let apiUrl = this.$store.state.apiUrl
			this.axios.get(apiUrl+'/role/list')
			.then( response => response.data )
			.then( res => {
				if( res.status ){
					this.roles = res.data
				}
			})
		},
		getUsers(){
			let apiUrl = this.$store.state.apiUrl
			this.axios.get(apiUrl+'/user/list')
			.then( response => response.data )
			.then( res => {
				if(!this.checkLogin(res))return;
				if( res.status ){
					this.users = res.data
					this.userArr = res.data
				}
				this.loading = false
			})
		},
		getClients(){
			let apiUrl = this.$store.state.apiUrl
			this.axios.get(apiUrl+'/client/list')
			.then( response => response.data )
			.then( res => {
				if( res.status ){
					this.clients = res.data
				}
			})
		},
		submit(){
			if( !this.name || !this.account || !this.pwd || !this.selectRole ){
				this.$Message.warning({content: '请填写完整信息', duration: 3, closable: true});
				return;
			}
			if( !/^[0-9a-zA-Z][0-9a-zA-Z_]{0,}$/.test(this.account) || this.account.length<6 || this.account.length>11 ){
				this.$Message.warning({content: '请输入6-11位的数字、字母、下划线组成的账号', duration: 3, closable: true});
				return;
			}
			if( this.pwd.length<5 || this.pwd.length>20 ){
				this.$Message.warning({content: '请输入6-20位的密码', duration: 3, closable: true});
				return;
			}
			let apiUrl = this.$store.state.apiUrl
			if( this.modalTitle === '新增用户' && !this.edit ){
				this.axios.post(apiUrl+'/user/new', {
					name: this.name, 
					account: this.account, 
					pwd: this.pwd, 
					roles: this.selectRole})
					.then( response => response.data )
					.then( res => {
						if(!this.checkLogin(res))return;
						if( res.status == 1 ){
							this.newUser = false
							this.clear()
							this.$Message.success({content: '创建成功', duration: 3, closable: true});
							this.getUsers()
						}else if( res.status == 2 ){
							this.newUser = false
							this.clear()
							this.$Message.warning({content: res.msg, duration: 5, closable: true});
							return;
						}else if( res.status == 3 ){
							this.$Message.warning({content: res.msg, duration: 5, closable: true});
							return;
						}else{
							this.$Message.error({content: '创建失败，请重新尝试！', duration: 3, closable: true});
						}
					})
			}else{
				this.axios.post(apiUrl+'/user/update', {
					id: this.edit._id,
					name: this.name, 
					account: this.account, 
					pwd: this.pwd, 
					roles: 
					this.selectRole})
					.then( response => response.data )
					.then( res => {
						if(!this.checkLogin(res))return;
						if( res.status ){
							this.newUser = false
							this.clear()
							this.$Message.success({content: '更新成功', duration: 3, closable: true});
							this.getUsers()
						}else{
							this.$Message.error({content: '更新失败，请重新尝试！', duration: 3, closable: true});
						}
					})
			}
			
		},
		remove(id){
			if( !id ) return;
			this.$Modal.confirm({
                title: '确认删除',
                content: '<p>确定删除该用户？</p>',
                onOk: () => {
                    let apiUrl = this.$store.state.apiUrl
					this.axios.post(apiUrl+'/user/remove', {id: id})
						.then(response => response.data)
						.then( res => {
							if(!this.checkLogin(res))return;
							if( res.status ){
								this.$Message.success({content: '删除成功', duration: 3, closable: true});
				                this.getUsers();

				                if( this.pageCurrent!=1 ){
				                	if( this.clients.length-1 <= (this.pageCurrent-1) * this.pageSize ){
				                		this.pageCurrent -= 1
				                	} 
				                }
							}else{
								this.$Message.error({content: '删除失败，请稍后尝试', duration: 3, closable: true});
							}
						})
                },
                onCancel: () => {
                    //
                }
            });
		},
		doedit(id){
			if( !id ) return;
			this.modalTitle = "编辑用户"
			this.newUser = true
			// 遍历users，找出当前编辑的用户
			for( let i=0;i<this.users.length;i++ ){
				if( this.users[i]._id === id ){
					
					this.name = this.users[i].name
					this.account = this.users[i].account
					this.pwd = this.users[i].pwd
					this.edit = this.users[i]
					// 遍历roles，找出当前编辑的用户拥有的角色
					for( let j=0;j<this.roles.length;j++ ){
						if( this.users[i].roles.indexOf( this.roles[j]._id ) >=0  ){
							this.selectRole.push( this.roles[j]._id )
						}
					}
					
				}
			}
		},
		cancel(){
			this.newUser = false
			this.clear()
		},
		clear(){
			this.name = ''
			this.account = ''
			this.pwd = ''
			this.modalTitle = "新增用户"
			this.selectRole = []
			this.edit = null
		},
		dosearch(){
			if( (this.searchmode != 'time' && this.search === '') 
				||
				(this.searchmode == 'time' && ( !this.daterange[0] || !this.daterange[1] ) )
			){
				this.$Message.warning({content: '请输入搜索内容', duration: 3, closable: true});
				return;
			}
			let users = [];
			
			if( this.searchmode === 'name' ){
				for( let i=0;i<this.userArr.length;i++ ){
					if( this.userArr[i].name.indexOf(this.search)>=0 || this.userArr[i].account == this.search ){
						users.push(this.userArr[i])
					}
				}
			}else if( this.searchmode === 'parent' ){
				let parentAccount = '';
				for( let i=0;i<this.userArr.length;i++ ){
					if( this.userArr[i].name.indexOf(this.search)>=0 || this.userArr[i].account == this.search ){
						parentAccount = this.userArr[i]._id
					}
				}
				if( parentAccount ){
					for( let i=0;i<this.userArr.length;i++ ){
						if( this.userArr[i].parents.indexOf(parentAccount)>=0 ){
							users.push(this.userArr[i])
						}
					}
				}
			}else if( this.searchmode === 'client' ){
				let clientUser = '';
				for( let i=0;i<this.clients.length;i++ ){
					if( this.clients[i].name.indexOf(this.search)>=0 ){
						clientUser = this.clients[i].user
					}
				}
				if( clientUser ){
					for( let i=0;i<this.userArr.length;i++ ){
						if( this.userArr[i]._id ==  clientUser){
							users.push(this.userArr[i])
						}
					}
				}
			}else if( this.searchmode === 'time' ){
				let timeStart = new Date( this.daterange[0] ).valueOf()
				let timeEnd = new Date( this.daterange[1] ).valueOf()
				
				for( let i=0;i<this.userArr.length;i++ ){
					let createAt = new Date(this.userArr[i].createAt).valueOf()
					if( createAt > timeStart && createAt < timeEnd ){
						users.push(this.userArr[i])
					}
				}

			}
			this.users = users
			this.pageCurrent = 1
		},
		changepage(num){
			this.pageCurrent = num
		},
		clearSearch(){
			this.users = this.userArr
			this.search = ''
			this.daterange = null
			this.pageCurrent = 1
		}
	},
	computed:{
		showUser(){
			let permission = this.$store.state.permissions
			return permission ? permission.dom.indexOf('user')>=0 : flase
		},
		userInfo(){
			return this.$store.state.userInfo._id
		}
	},
	mounted(){
		this.getRoles()
		this.getClients()
		this.getUsers()
	}
}
</script>

<style scoped></style>
