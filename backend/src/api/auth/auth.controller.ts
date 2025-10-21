import { Request, Response } from 'express';
import * as authService from './auth.service';

// --- REGISTRO ---
export const registerUser = async (req: Request, res: Response) => {
    try {
        const userData = req.body;
        const newUser = await authService.createUser(userData);
        res.status(201).json({
            message: 'Usuario registrado exitosamente',
            userId: newUser.insertId
        });
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

// --- LOGIN ---
export const loginUser = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;
        const { token, user } = await authService.login(email, password);
        res.status(200).json({
            message: "Login exitoso",
            token: token,
            user: {
                id: user.id, // <-- CORREGIDO: Usar 'id'
                email: user.email,
                rol: user.rol,
                nombres_apellidos: user.nombres_apellidos,
            },
        });
    } catch (error: any) {
        res.status(401).json({ message: error.message });
    }
};

// --- VERIFICACIÓN DE TOKEN ---
export const verifyToken = async (req: Request, res: Response) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ message: 'No se proveyó un token.' });
        }
        const token = authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'Token malformado.' });
        }
        const user = await authService.verify(token);
        res.status(200).json({ user });
    } catch (error: any) {
        res.status(401).json({ message: error.message });
    }
};