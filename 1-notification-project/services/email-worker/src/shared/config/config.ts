try {
	process.loadEnvFile();
} catch {
	console.error("[ERROR] ❌ .env file not found!");
}

export const config = {
	env: process.env.NODE_ENV,
	port: process.env.PORT,
	rabbitmq: {
		uri: process.env.RABBITMQ_URI
	}
}