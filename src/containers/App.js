/*
 * @Author: Edlan
 * @Date: 2018-10-22 14:58:53
 * @Description: 
 */
import React, { PureComponent } from 'react';
import { Route, Switch, withRouter } from 'react-router-dom'
import PrivateRoute from 'components/Authorized/PrivateRoute'
import storage from 'utils/storage';
import Layout from '../layout'
import Login from './Login'


@withRouter
class App extends PureComponent {
  constructor(props){
    super(props)
  }
  
  componentWillMount(){
    this.checkLogin();
  }

  componentWillReceiveProps() {
    this.checkLogin();
  }

  checkLogin = () => {
    const isAuthenticated = !!storage.getItem('token');
    this.setState({ isAuthenticated })
  }
  
  render(){
    const { isAuthenticated } = this.state;
    return (
      <Switch>
        <Route path="/login" component={Login} />
        <PrivateRoute
          path="/"
          isAuthenticated={isAuthenticated}
          render={props => <Layout {...props} />}
        />
      </Switch>
    )
  }
}

export default App