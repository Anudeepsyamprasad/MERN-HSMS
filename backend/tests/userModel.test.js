// Password hashing on the User model. Runs without a database:
// document.validate() runs the pre-validate hook that hashes the password.
const User = require('../models/User');

describe('User password hashing', () => {
  test('stores a bcrypt hash, never the plain password', async () => {
    const user = new User({ username: 'alice', email: 'alice@example.com', password: 'secret123', role: 'patient' });
    await user.validate();

    expect(user.passwordHash).not.toBe('secret123');
    expect(user.passwordHash).toMatch(/^\$2[aby]\$12\$/); // bcrypt, cost 12
  });

  test('comparePassword is async and checks correctly', async () => {
    const user = new User({ username: 'bob', email: 'bob@example.com', password: 'secret123', role: 'patient' });
    await user.validate();

    await expect(user.comparePassword('secret123')).resolves.toBe(true);
    await expect(user.comparePassword('wrong-password')).resolves.toBe(false);
  });

  test('changing the password re-hashes it', async () => {
    const user = new User({ username: 'carol', email: 'carol@example.com', password: 'first-pass', role: 'patient' });
    await user.validate();
    const firstHash = user.passwordHash;

    user.password = 'second-pass';
    await user.validate();

    expect(user.passwordHash).not.toBe(firstHash);
    await expect(user.comparePassword('second-pass')).resolves.toBe(true);
  });
});
