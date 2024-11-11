import { Router } from 'itty-router'

import admin from './api/admin'
import auth from './api/auth'
import ids from './api/ids'
import namespaces from './api/namespaces'
import users from './api/users'
import { lowerParams } from './api/util'

import type { IMethods, IRequest } from './api/types'

export const router = Router<IRequest, IMethods>()

/// ADMIN ///
router.post('/schema', auth.admin, admin.updateSchema)
router.get('/admin', auth.admin, admin.getAllData)
router.get('/stats', auth.admin, admin.getStats)

/// USERS ///
// Get users
router.get('/users', lowerParams, auth.admin, users.getUsers)
// Create user
router.post('/:user', lowerParams, lowerParams, auth.admin, users.createUser)
// Delete user
router.delete('/:user', lowerParams, auth.admin, users.deleteUser)

/// Namespaces ///
// List namespaces
router.get('/:user', lowerParams, auth.user, namespaces.getNamespaces)
// Create namespace
router.post('/:user/:namespace', lowerParams, auth.user, namespaces.createNamespace)
// Delete namespace
router.delete('/:user/:namespace', lowerParams, auth.user, namespaces.deleteNamespace)

/// IDs ///
// List IDs
router.get('/:user/:namespace', lowerParams, auth.user, ids.getIDs)
// Generate ID
router.get('/:user/:namespace/new', lowerParams, auth.user, ids.generateID)
// Add ID
router.post('/:user/:namespace/:id', lowerParams, auth.user, ids.addID)
// Delete ID
router.delete('/:user/:namespace/:id', lowerParams, auth.user, ids.deleteID)
