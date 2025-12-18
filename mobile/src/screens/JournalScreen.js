import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  RefreshControl,
  TextInput,
  Modal,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { journalService } from '../services/journalService';

const JournalScreen = ({ navigation }) => {
  const [journalEntries, setJournalEntries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showAddEntryModal, setShowAddEntryModal] = useState(false);
  const [newEntry, setNewEntry] = useState({
    title: '',
    content: '',
    tags: '',
  });

  const loadJournalEntries = async () => {
    try {
      const result = await journalService.getJournalEntries();
      if (result.success) {
        setJournalEntries(result.data || []);
      } else {
        console.error('Failed to load journal entries:', result.error);
        // Don't show alert for network errors, just log them
        if (result.error !== 'Network Error' && result.error !== 'Network Error - Please check your connection') {
          Alert.alert('Error', result.error);
        }
        // Set empty array for network errors to show empty state
        if (result.error === 'Network Error' || result.error === 'Network Error - Please check your connection') {
          setJournalEntries([]);
        }
      }
    } catch (error) {
      console.error('Exception in loadJournalEntries:', error);
      // Set empty array for exceptions to show empty state
      setJournalEntries([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadJournalEntries();
    }, [])
  );

  const onRefresh = () => {
    setIsRefreshing(true);
    loadJournalEntries();
  };

  const handleAddEntry = async () => {
    if (!newEntry.title || !newEntry.content) {
      Alert.alert('Error', 'Please fill in title and content');
      return;
    }

    try {
      const entryData = {
        title: newEntry.title,
        content: newEntry.content,
        tags: newEntry.tags ? newEntry.tags.split(',').map(tag => tag.trim()) : [],
      };

      const result = await journalService.createJournalEntry(entryData);
      if (result.success) {
        setShowAddEntryModal(false);
        setNewEntry({
          title: '',
          content: '',
          tags: '',
        });
        loadJournalEntries(); // Refresh
        Alert.alert('Success', 'Journal entry created successfully!');
      } else {
        Alert.alert('Error', result.error);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to create journal entry');
    }
  };

  const pickImages = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (perm.status !== 'granted') {
        Alert.alert('Permission required', 'We need access to your photos to attach images.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({ allowsMultipleSelection: true, mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7 });
      if (result.canceled) return;
      const selected = (result.assets || []).map(a => a.uri);
      const suffix = selected.map(u => `\n![image](${u})`).join('');
      setNewEntry(prev => ({ ...prev, content: (prev.content || '') + suffix }));
    } catch (e) {
      Alert.alert('Error', 'Failed to pick images');
    }
  };

  const applyFormat = (type) => {
    // Simple markdown-like helpers for quick formatting
    const { title, content } = newEntry;
    if (type === 'bold') setNewEntry({ ...newEntry, content: `${content || ''} **bold**` });
    if (type === 'italic') setNewEntry({ ...newEntry, content: `${content || ''} *italic*` });
    if (type === 'h2') setNewEntry({ ...newEntry, content: `${content || ''}\n\n## Heading` });
    if (type === 'ul') setNewEntry({ ...newEntry, content: `${content || ''}\n- item` });
    if (type === 'ol') setNewEntry({ ...newEntry, content: `${content || ''}\n1. item` });
  };

  const handleDeleteEntry = async (entryId) => {
    Alert.alert(
      'Delete Entry',
      'Are you sure you want to delete this journal entry?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await journalService.deleteJournalEntry(entryId);
              if (result.success) {
                loadJournalEntries(); // Refresh
                Alert.alert('Success', 'Journal entry deleted!');
              } else {
                Alert.alert('Error', result.error);
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to delete journal entry');
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const renderEntry = (entry) => {
    return (
      <View key={entry.id} style={styles.entryCard}>
        <View style={styles.entryHeader}>
          <Text style={styles.entryTitle}>{entry.title}</Text>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteEntry(entry.id)}
          >
            <Text style={styles.deleteButtonText}>×</Text>
          </TouchableOpacity>
        </View>
        
        <Text style={styles.entryDate}>
          {formatDate(entry.createdAt)}
        </Text>
        
        <Text style={styles.entryContent} numberOfLines={3}>
          {entry.content}
        </Text>
        
        {entry.tags && entry.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {entry.tags.map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        )}
        
        <TouchableOpacity
          style={styles.viewButton}
          onPress={() => {
            // TODO: Navigate to entry details
            Alert.alert('Info', 'Journal entry details screen coming soon!');
          }}
        >
          <Text style={styles.viewButtonText}>Read More</Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <Text>Loading journal entries...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>My Journal</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddEntryModal(true)}
        >
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      {journalEntries.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No journal entries yet</Text>
          <Text style={styles.emptySubtext}>
            Start writing your campaign journal!
          </Text>
        </View>
      ) : (
        <View style={styles.entriesList}>
          {journalEntries.map(renderEntry)}
        </View>
      )}

      {/* Add Entry Modal */}
      <Modal
        visible={showAddEntryModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddEntryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>New Journal Entry</Text>
            <View style={styles.toolbar}>
              <TouchableOpacity style={styles.tbBtn} onPress={() => applyFormat('bold')}><Text style={styles.tbTxt}>B</Text></TouchableOpacity>
              <TouchableOpacity style={styles.tbBtn} onPress={() => applyFormat('italic')}><Text style={styles.tbTxt}>I</Text></TouchableOpacity>
              <TouchableOpacity style={styles.tbBtn} onPress={() => applyFormat('h2')}><Text style={styles.tbTxt}>H2</Text></TouchableOpacity>
              <TouchableOpacity style={styles.tbBtn} onPress={() => applyFormat('ul')}><Text style={styles.tbTxt}>•</Text></TouchableOpacity>
              <TouchableOpacity style={styles.tbBtn} onPress={() => applyFormat('ol')}><Text style={styles.tbTxt}>1.</Text></TouchableOpacity>
            </View>
            
            <TextInput
              style={styles.modalInput}
              placeholder="Entry Title"
              value={newEntry.title}
              onChangeText={(text) => setNewEntry({ ...newEntry, title: text })}
            />
            
            <TextInput
              style={[styles.modalInput, styles.contentInput]}
              placeholder="Entry Content"
              value={newEntry.content}
              onChangeText={(text) => setNewEntry({ ...newEntry, content: text })}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
            <TouchableOpacity style={styles.attachBtn} onPress={pickImages}>
              <Text style={styles.attachBtnText}>Attach Images</Text>
            </TouchableOpacity>
            {!!newEntry.content && (
              <View style={styles.previewBox}>
                <Text style={styles.previewTitle}>Preview</Text>
                <Text style={styles.previewText}>{newEntry.content}</Text>
              </View>
            )}
            
            <TextInput
              style={styles.modalInput}
              placeholder="Tags (comma separated)"
              value={newEntry.tags}
              onChangeText={(text) => setNewEntry({ ...newEntry, tags: text })}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowAddEntryModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.createButton]}
                onPress={handleAddEntry}
              >
                <Text style={styles.createButtonText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    backgroundColor: '#28a745',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  entriesList: {
    padding: 15,
  },
  entryCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  entryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  deleteButton: {
    backgroundColor: '#dc3545',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  entryDate: {
    fontSize: 12,
    color: '#666',
    marginBottom: 10,
  },
  entryContent: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 15,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 15,
  },
  tag: {
    backgroundColor: '#e9ecef',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 12,
    color: '#495057',
  },
  viewButton: {
    backgroundColor: '#28a745',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  viewButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 10,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    width: '90%',
    maxWidth: 500,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  toolbar: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  tbBtn: {
    backgroundColor: '#f1f3f5',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    marginRight: 6,
  },
  tbTxt: {
    fontWeight: '700',
    color: '#333',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  contentInput: {
    height: 120,
  },
  previewBox: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 10,
    backgroundColor: '#f8fafc',
    marginBottom: 12,
  },
  previewTitle: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 6,
  },
  previewText: {
    fontSize: 14,
    color: '#111827',
    lineHeight: 20,
  },
  attachBtn: {
    backgroundColor: '#0ea5e9',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  attachBtnText: {
    color: 'white',
    fontWeight: '700',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  createButton: {
    backgroundColor: '#28a745',
  },
  cancelButtonText: {
    color: '#333',
    fontWeight: 'bold',
  },
  createButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default JournalScreen;

