import passport from 'passport';
import local from 'passport-local';
import { userModel } from '../Dao/models/users.model.js';
import { createHash, validatePassword } from '../utils.js';
import GitHubStrategy from 'passport-github2';

const LocalStrategy = local.Strategy;

const initializePassport = () => {

    passport.use('register', new LocalStrategy({passReqToCallback:true, usernameField:'email'}, async (req, username, password, done) => {
            const {first_name, last_name, email, age} = req.body;
            try {
                let user = await userModel.findOne({email:username}); 
                if(user || email === "adminCoder@coder.com"){ //No error occurred but this user already exist and can not continue
                    console.log('User already exist');
                    return done(null,false);
                }else{ //Everything OK
                    const newUser = {
                        first_name,
                        last_name,
                        email,
                        age,
                        password: createHash(password),
                        rol: "user"
                    };
                    let result = await userModel.create(newUser);
                    return done(null, result);
                }
            } catch (error) { //Everything bad, send error
                return done("Error ocurred when try to register: " + error);
            }
    }));

    passport.serializeUser((user, done) => {
        done(null, user._id)
    });

    passport.deserializeUser(async (id, done) => {
        if(id === 0){
            const user = {
                _id: 0, //A modo de prueba, teniendo en cuenta que ningun usuario va a tener ese ID, para serializar
                first_name: 'Administrador',
                last_name: 'Del Sistema',
                email: email,
                age: 99,
                rol: 'admin'
            };
        }else{
            const user = await userModel.findById(id);
        }
        done(null, user)
    });

    passport.use('login', new LocalStrategy({usernameField:'email'}, async (email, password, done)=>{

        try {
            let user;
            console.log("Login de passport.config")
            if(email === "adminCoder@coder.com" && password === "adminCod3r123"){
                user = {
                    _id: 0, //A modo de prueba, teniendo en cuenta que ningun usuario va a tener ese ID, para serializar
                    first_name: 'Administrador',
                    last_name: 'Del Sistema',
                    email: email,
                    age: 99,
                    rol: 'admin'
                };
                return done(null, user);
            }else{
                user = await userModel.findOne({email});
                if(!user){
                    console.log("El usuario no existe")
                    return done(null, false);
                }else{
                    if(!validatePassword(password,user)) return done (null, false);
                    console.log("Todo ok")
                    return done(null, user);
                }
            }
        } catch (error) {
            console.log("Todo RE MAL")
            return done("Error ocurred when try to login: " + error);
            
        }

    }));

    passport.use('github', new GitHubStrategy({
        clientID:'Iv1.93f85af26fd2f3f4',
        clientSecret:'8afe3386e6b0f7b31ab650784f68be525616bae7',
        callbackURL: 'http://localhost:8080/api/sessions/githubcallback',
        scope: ["user:email"]
        },
        async (accesToken, refreshToken, profile, done)=>{
            try {    
                console.log(profile);
                let user = await userModel.findOne({email: profile._json.email});
                
                if(!user){
                    let email;
                    if(profile._json.email != null){
                        email = profile._json.email;
                    }else{
                        email = 'Email not available';
                    }
                    const newUser = {
                            first_name: profile._json.name,
                            last_name:'',
                            email: email,
                            age: 18,
                            password: '',
                            rol: 'user'
                    }
                    const result = await userModel.create(newUser);
                    done(null, result);
                }else{
                    done(null, user);
                }
            } catch (error) {
                return done(null, error);
            }
        }
    ));
}

export default initializePassport;