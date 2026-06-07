import bcrypt from 'bcrypt'

const hashPassword = (password:string)=>{
    const hashedPassword = bcrypt.hash(password,10)
    return hashedPassword
}

const checkPassword = (password:string,hashedPassword:string):Promise<boolean>=>{
    return bcrypt.compare(password, hashedPassword)
}

export {
    hashPassword,
    checkPassword
}