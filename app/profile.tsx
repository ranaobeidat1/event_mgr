// app/(tabs)/profile.tsx
import React, { useEffect, useState } from 'react'
import {
  SafeAreaView,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  Linking,
  I18nManager,
} from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons, MaterialIcons } from '@expo/vector-icons'
import { auth, db } from '../FirebaseConfig'
import { getUser } from './utils/firestoreUtils'
import {
  signOut,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from 'firebase/auth'
import { doc, updateDoc } from 'firebase/firestore'



const WHATSAPP_URL =
  'https://api.whatsapp.com/send/?phone=0533551455&text=%D7%A9%D7%9C%D7%95%D7%9D%2C+%D7%91%D7%90%D7%AA%D7%99+%D7%93%D7%A8%D7%9A+%D7%94%D7%90%D7%AA%D7%A8&type=phone_number&app_absent=0'

const Profile = () => {
  const router = useRouter()
  const [userData, setUserData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // modals + form state
  const [editModalVisible, setEditModalVisible] = useState(false)
  const [newFirstName, setNewFirstName] = useState('')
  const [newLastName, setNewLastName] = useState('')

  const [passwordModalVisible, setPasswordModalVisible] = useState(false)
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  useEffect(() => {
    async function fetchUser() {
      try {
        const u = auth.currentUser
        if (u) {
          const data = await getUser(u.uid)
          setUserData(data)
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    fetchUser()
  }, [])

  // seed edit form
  useEffect(() => {
    if (userData) {
      setNewFirstName(userData.firstName)
      setNewLastName(userData.lastName)
    }
  }, [userData])

  const handleSignOut = () => {
    signOut(auth)
      .then(() => router.replace('/login'))
      .catch(console.error)
  }

  const handleMenuPress = (label: string) => {
    const key = label
    if (key === 'צור קשר') {
      Linking.openURL(WHATSAPP_URL).catch(console.error)
    } else if (key === 'מידע אישי') {
      setEditModalVisible(true)
    } else if (key === 'כניסה ואבטחה') {
      setPasswordModalVisible(true)
    } else if (key === 'ניהול משתמשים') {
      router.push('/users')
    }
  }

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-[#F5F6FA] justify-center items-center" style={{direction: 'rtl'}}>
        <Text>טוען…</Text>
      </SafeAreaView>
    )
  }

  // Check if the user is an admin to show admin-specific options
  const isAdmin = userData?.role === "admin";

  const sections = [
    [
      { label: 'מידע אישי', icon: <MaterialIcons name="person-outline" size={24}/> },
      { label: 'כניסה ואבטחה', icon: <MaterialIcons name="security" size={24}/> },
    ],
    // Show admin section only for admin users
    ...(isAdmin ? [[
      { label: 'ניהול משתמשים', icon: <MaterialIcons name="people" size={24}/> },
    ]] : []),
    [
      { label: 'צור קשר', icon: <MaterialIcons name="message" size={24}/> },
    ],
  ]

  return (
    <SafeAreaView className="flex-1 bg-[#F5F6FA]" style={{direction: 'rtl'}}>
      {/* Header */}
      <View className="flex-row-reverse items-center justify-between bg-white h-14 px-5">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} style={{transform: [{rotate: '180deg'}]}} />
        </TouchableOpacity>
        <Text className="text-lg font-semibold">הפרופיל</Text>
      </View>

      {/* Avatar + Name */}
      <View className="items-center mb-6">
        <View className="w-full h-24 bg-[#1A4782]" />
        <View className="absolute top-16 w-full items-center">
          <View className="w-20 h-20 bg-white rounded-full justify-center items-center shadow-lg">
            <Ionicons name="person" size={40} color="#bbb" />
          </View>
        </View>
        <Text className="mt-12 text-xl font-semibold text-gray-800" style={{textAlign: 'right'}}>
          {userData.firstName} {userData.lastName}
        </Text>
      </View>

      {/* Menu */}
      <ScrollView className="px-5">
        {sections.map((group, gi) => (
          <View key={gi} className="bg-white rounded-xl mb-4 overflow-hidden">
            {group.map((item, i) => (
              <TouchableOpacity
                key={i}
                className="flex-row items-center justify-end py-4 px-4 border-b border-gray-200 last:border-b-0"
                onPress={() => handleMenuPress(item.label)}
              >
                <Text className="text-base text-gray-800 text-right">
                  {item.label}
                </Text>
                <View className="w-7 items-center ml-4">
                  {item.icon}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ))}

        {/* Sign out */}
        <View className="bg-white rounded-xl mb-8 overflow-hidden">
          <TouchableOpacity
            className="flex-row items-center justify-end py-4 px-4"
            onPress={handleSignOut}
          >
            <Text className="text-base text-[#1A4782] font-medium text-right">
              התנתקות
            </Text>
            <Ionicons name="log-out-outline" size={24} style={{marginLeft: 16}} />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Edit Personal Info Modal */}
      <Modal
        transparent
        visible={editModalVisible}
        animationType="fade"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View className="flex-1 bg-black bg-opacity-50 justify-center items-center">
          <View className="bg-white mx-6 p-6 rounded-xl shadow-lg" style={{direction: 'rtl'}}>
            <Text className="text-lg font-semibold mb-4 text-right">ערוך שם</Text>
            <TextInput
              className="border border-gray-300 rounded px-3 py-2 mb-4 text-right"
              placeholder="שם פרטי"
              value={newFirstName}
              onChangeText={setNewFirstName}
            />
            <TextInput
              className="border border-gray-300 rounded px-3 py-2 mb-4 text-right"
              placeholder="שם משפחה"
              value={newLastName}
              onChangeText={setNewLastName}
            />
            <View className="flex-row-reverse justify-end">
              <TouchableOpacity
                className="px-4 py-2 ml-2"
                onPress={() => setEditModalVisible(false)}
              >
                <Text className="text-gray-600 text-right">ביטול</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="bg-[#1A4782] px-4 py-2 rounded"
                onPress={async () => {
                  try {
                    const uid = auth.currentUser!.uid
                    await updateDoc(doc(db, 'users', uid), {
                      firstName: newFirstName,
                      lastName: newLastName,
                    })
                    setUserData({
                      ...userData,
                      firstName: newFirstName,
                      lastName: newLastName,
                    })
                  } catch (e) {
                    console.error('Update name failed:', e)
                    Alert.alert('שגיאה', 'לא ניתן לעדכן שם.')
                  } finally {
                    setEditModalVisible(false)
                  }
                }}
              >
                <Text className="text-white font-medium text-right">שמור</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Change Password Modal */}
      <Modal
        transparent
        visible={passwordModalVisible}
        animationType="fade"
        onRequestClose={() => setPasswordModalVisible(false)}
      >
        <View className="flex-1 bg-black bg-opacity-50 justify-center items-center">
          <View className="bg-white mx-6 p-6 rounded-xl shadow-lg" style={{direction: 'rtl'}}>
            <Text className="text-lg font-semibold mb-4 text-right">שנה סיסמה</Text>
            <TextInput
              className="border border-gray-300 rounded px-3 py-2 mb-4 text-right"
              placeholder="סיסמה נוכחית"
              secureTextEntry
              value={oldPassword}
              onChangeText={setOldPassword}
            />
            <TextInput
              className="border border-gray-300 rounded px-3 py-2 mb-4 text-right"
              placeholder="סיסמה חדשה"
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
            />
            <TextInput
              className="border border-gray-300 rounded px-3 py-2 mb-4 text-right"
              placeholder="אישור סיסמה"
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
            <View className="flex-row-reverse justify-end">
              <TouchableOpacity
                className="px-4 py-2 ml-2"
                onPress={() => setPasswordModalVisible(false)}
              >
                <Text className="text-gray-600 text-right">ביטול</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="bg-[#1A4782] px-4 py-2 rounded"
                onPress={async () => {
                  if (newPassword !== confirmPassword) {
                    Alert.alert('שגיאה', 'הסיסמאות אינן תואמות.')
                    return
                  }
                  try {
                    const user = auth.currentUser!
                    const cred = EmailAuthProvider.credential(
                      user.email!,
                      oldPassword
                    )
                    await reauthenticateWithCredential(user, cred)
                    await updatePassword(user, newPassword)
                    Alert.alert('הצלחה', 'הסיסמה עודכנה.')
                  } catch (e) {
                    console.error('Password update failed:', e)
                    Alert.alert('שגיאה', 'לא ניתן לעדכן סיסמה.')
                  } finally {
                    setOldPassword('')
                    setNewPassword('')
                    setConfirmPassword('')
                    setPasswordModalVisible(false)
                  }
                }}
              >
                <Text className="text-white font-medium text-right">שמור</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

export default Profile
