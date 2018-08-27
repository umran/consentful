class Guinea {
  constructor(foo) {
    this._foo = foo
  }

  enum() {
    Object.keys(this._foo).forEach(function(key){
      console.log(key)
    })
  }
}

const guinea = new Guinea({
  authority: 'Giritech Notary Services',
  email: 'notary@giritech.io'
})

guinea.enum()
